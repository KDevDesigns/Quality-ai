import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { authStore, hashToken, SESSION_TTL_MS } from "@/lib/auth/store";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { createTestDb } from "./helpers/test-db";

let db: PrismaClient;
let cleanup: () => Promise<void>;
let t = new Date("2026-10-28T00:00:00Z").getTime();
const now = () => new Date(t);
const DAY = 24 * 60 * 60 * 1000;

beforeAll(async () => {
  ({ db, cleanup } = await createTestDb());
});

afterAll(async () => {
  await cleanup();
});

beforeEach(async () => {
  await db.session.deleteMany();
  await db.user.deleteMany();
  t = new Date("2026-10-28T00:00:00Z").getTime();
});

describe("authStore", () => {
  it("creates users with a lower-case email and checks credentials", async () => {
    const store = authStore(db, now);
    await store.createUser({ name: "Ana QA", email: "  Ana@Example.GOV.ph ", role: "QA", password: "temp-pass-123" });

    const u = await db.user.findUniqueOrThrow({ where: { email: "ana@example.gov.ph" } });
    expect(u.passwordHash).not.toContain("temp-pass-123");
    expect(u.mustChangePassword).toBe(true);

    expect(await store.checkCredentials("ANA@example.gov.ph", "temp-pass-123")).toMatchObject({ name: "Ana QA", role: "QA", designer: false, mustChangePassword: true });
    await store.createUser({ name: "Kevin", email: "kevin@example.gov.ph", role: "QA", designer: true, password: "temp-pass-123" });
    expect(await store.checkCredentials("kevin@example.gov.ph", "temp-pass-123")).toMatchObject({ role: "QA", designer: true });
    expect(await store.checkCredentials("ana@example.gov.ph", "wrong")).toBeNull();
    expect(await store.checkCredentials("nobody@example.gov.ph", "temp-pass-123")).toBeNull();
  });

  it("refuses turned-off accounts", async () => {
    const store = authStore(db, now);
    const { id } = await store.createUser({ name: "Dev", email: "dev@x.ph", role: "DEV", password: "pw-1234567" });
    const { token } = await store.createSession(id);
    await db.user.update({ where: { id }, data: { active: false } });

    expect(await store.checkCredentials("dev@x.ph", "pw-1234567")).toBeNull();
    expect(await store.resolveSession(token)).toBeNull();
    expect(await db.session.count()).toBe(0);
  });

  it("keeps a sign-up pending, then gives its own browser a temporary password after approval", async () => {
    const store = authStore(db, now);
    const { result, secret } = await store.signUp({ name: "Ana", email: " Ana@X.ph ", role: "QA" });
    expect(result).toBe("created");
    expect(secret).toBeTruthy();
    const u = await db.user.findUniqueOrThrow({ where: { email: "ana@x.ph" } });
    expect(u).toMatchObject({ pending: true, active: false, mustChangePassword: true, role: "QA" });
    expect(u.claimHash).not.toBe(secret); // only the hash is stored

    // Waiting: the browser sees its request is waiting, but can't get a password yet.
    expect(await store.claimStatus(secret!)).toMatchObject({ state: "waiting", name: "Ana" });
    expect(await store.claimTempPassword(secret!, () => "temp-pass-1")).toBeNull();

    // Approval makes no password: the browser gets it.
    let made = 0;
    expect(await store.approveSignUp(u.id, () => `temp-${++made}`)).toEqual({ tempPassword: null });
    expect(made).toBe(0);
    expect(await store.approveSignUp(u.id, () => "temp-again")).toBeNull(); // already handled
    expect(await store.claimStatus(secret!)).toMatchObject({ state: "approved", waitSeconds: 0 });

    expect(await store.claimTempPassword(secret!, () => "temp-pass-1")).toEqual({ tempPassword: "temp-pass-1", email: "ana@x.ph" });
    expect(await store.checkCredentials("ana@x.ph", "temp-pass-1")).toMatchObject({ name: "Ana", mustChangePassword: true });
    expect(await store.rejectSignUp(u.id)).toBe(false); // approved accounts can't be "rejected" (deleted)
  });

  it("makes a new temporary password at most once a minute, and the newest one replaces the last", async () => {
    const store = authStore(db, now);
    const { secret } = await store.signUp({ name: "Ben", email: "ben@x.ph", role: "DEV" });
    const u = await db.user.findUniqueOrThrow({ where: { email: "ben@x.ph" } });
    await store.approveSignUp(u.id, () => "unused");

    await store.claimTempPassword(secret!, () => "first-pass-1");
    t += 30_000;
    expect(await store.claimTempPassword(secret!, () => "second-pass")).toEqual({ waitSeconds: 30 });
    expect(await store.checkCredentials("ben@x.ph", "first-pass-1")).not.toBeNull();
    t += 30_000;
    expect(await store.claimTempPassword(secret!, () => "second-pass")).toMatchObject({ tempPassword: "second-pass" });
    expect(await store.checkCredentials("ben@x.ph", "first-pass-1")).toBeNull();
    expect(await store.checkCredentials("ben@x.ph", "second-pass")).not.toBeNull();
  });

  it("refuses any other browser, and ends the claim once they choose their own password", async () => {
    const store = authStore(db, now);
    const { secret } = await store.signUp({ name: "Cy", email: "cy@x.ph", role: "QA" });
    const u = await db.user.findUniqueOrThrow({ where: { email: "cy@x.ph" } });
    await store.approveSignUp(u.id, () => "unused");

    // Someone else signing up with the same email gets nothing, and can't get the password.
    expect(await store.signUp({ name: "Imposter", email: "cy@x.ph", role: "DEV" })).toEqual({ result: "exists" });
    expect(await store.signUp({ name: "Imposter", email: "cy@x.ph", role: "DEV" }, "a-guessed-secret")).toEqual({ result: "exists" });
    expect(await store.claimTempPassword("a-guessed-secret", () => "stolen-pass")).toBeNull();
    expect(await store.claimStatus("")).toBeNull();

    // The same browser signing up again is fine, and may change the nickname (not the role, once approved).
    expect(await store.signUp({ name: "Cyrus", email: "CY@x.ph", role: "DEV" }, secret)).toEqual({ result: "again", secret });
    expect(await db.user.findUniqueOrThrow({ where: { id: u.id } })).toMatchObject({ name: "Cyrus", role: "QA" });

    await store.claimTempPassword(secret!, () => "temp-pass-1");
    await store.setPassword(u.id, "their-own-pass", false);
    expect(await store.claimStatus(secret!)).toBeNull();
    expect(await store.claimTempPassword(secret!, () => "again-pass")).toBeNull();
    expect(await store.signUp({ name: "Cy", email: "cy@x.ph", role: "QA" }, secret)).toEqual({ result: "exists" });
  });

  it("ends the claim at sign-in, signs out earlier sessions on a new password, and keeps one request per browser", async () => {
    const store = authStore(db, now);
    const { secret } = await store.signUp({ name: "Dee", email: "dee@x.ph", role: "QA" });
    const u = await db.user.findUniqueOrThrow({ where: { email: "dee@x.ph" } });

    // A second email from the same browser is refused while the first request is open.
    expect(await store.signUp({ name: "Dee", email: "other@x.ph", role: "QA" }, secret)).toEqual({ result: "busy", busyEmail: "dee@x.ph" });
    expect(await db.user.count({ where: { email: "other@x.ph" } })).toBe(0);

    await store.approveSignUp(u.id, () => "unused");
    await store.claimTempPassword(secret!, () => "first-pass-1");
    const { token } = await store.createSession(u.id);
    t += 60_000;
    await store.claimTempPassword(secret!, () => "second-pass");
    expect(await store.resolveSession(token)).toBeNull(); // the earlier temporary password's session is gone

    // Signing in ends the claim: nobody on that browser can make another one.
    await store.endClaim(u.id);
    expect(await store.claimStatus(secret!)).toBeNull();
    t += 60_000;
    expect(await store.claimTempPassword(secret!, () => "third-pass")).toBeNull();
    expect(await store.checkCredentials("dee@x.ph", "second-pass")).not.toBeNull();
  });

  it("still gives the admin a temporary password for a request made before browsers remembered it", async () => {
    const store = authStore(db, now);
    // How older requests were stored: a random password nobody knows, and no claim.
    const older = await db.user.create({ data: { name: "Old", email: "old@x.ph", role: "DEV", passwordHash: "scrypt$unknown", active: false, pending: true, mustChangePassword: true } });
    expect(await store.approveSignUp(older.id, () => "temp-pass-123")).toEqual({ tempPassword: "temp-pass-123" });
    expect(await store.checkCredentials("old@x.ph", "temp-pass-123")).toMatchObject({ name: "Old", mustChangePassword: true });
    expect(await store.approveSignUp(older.id, () => "another-pass")).toBeNull(); // already handled; password unchanged
    expect(await store.checkCredentials("old@x.ph", "another-pass")).toBeNull();
  });

  it("doesn't overwrite an existing account and deletes rejected sign-ups", async () => {
    const store = authStore(db, now);
    await store.createUser({ name: "Dev", email: "dev@x.ph", role: "DEV", password: "pw-1234567" });
    expect((await store.signUp({ name: "Imposter", email: "dev@x.ph", role: "QA" })).result).toBe("exists");
    expect(await store.checkCredentials("dev@x.ph", "pw-1234567")).toMatchObject({ name: "Dev", role: "DEV" });

    await store.signUp({ name: "Spam", email: "spam@x.ph", role: "DEV" });
    expect((await store.signUp({ name: "Spam again", email: "SPAM@x.ph", role: "DEV" })).result).toBe("pending");
    const spam = await db.user.findUniqueOrThrow({ where: { email: "spam@x.ph" } });
    expect(await store.rejectSignUp(spam.id)).toBe(true);
    expect(await db.user.count({ where: { email: "spam@x.ph" } })).toBe(0);
    await expect(store.signUp({ name: "Root", email: "root@x.ph", role: "ADMIN" })).rejects.toThrow(/Admins/);
  });

  it("flags forgot-password requests for an admin, and only for working accounts", async () => {
    const store = authStore(db, now);
    const { id } = await store.createUser({ name: "Dev", email: "dev@x.ph", role: "DEV", password: "pw-1234567" });
    await store.signUp({ name: "New", email: "new@x.ph", role: "QA" });
    const off = await store.createUser({ name: "Off", email: "off@x.ph", role: "QA", password: "pw-1234567" });
    await db.user.update({ where: { id: off.id }, data: { active: false } });

    expect(await store.requestReset("nobody@x.ph")).toBe("unknown");
    expect(await store.requestReset("new@x.ph")).toBe("pending");
    expect(await store.requestReset("off@x.ph")).toBe("inactive");
    expect(await store.requestReset(" Dev@X.ph ")).toBe("requested");
    expect(await store.adminRequests()).toEqual({ signUps: 1, resets: 1 });
    // The password itself is untouched until an admin resets it.
    expect(await store.checkCredentials("dev@x.ph", "pw-1234567")).not.toBeNull();

    expect(await store.clearResetRequest(id)).toBe(true);
    expect(await store.clearResetRequest(id)).toBe(false);
    expect(await store.adminRequests()).toEqual({ signUps: 1, resets: 0 });
  });

  it("stores only the token hash and resolves the session", async () => {
    const store = authStore(db, now);
    const { id } = await store.createUser({ name: "Dev", email: "dev@x.ph", role: "DEV", password: "pw-1234567" });
    const { token, expiresAt } = await store.createSession(id);

    const row = await db.session.findFirstOrThrow();
    expect(row.id).toBe(hashToken(token));
    expect(row.id).not.toBe(token);
    expect(expiresAt.getTime()).toBe(t + SESSION_TTL_MS);
    expect(await store.resolveSession(token)).toMatchObject({ id, role: "DEV" });
    expect(await store.resolveSession("not-a-token")).toBeNull();
    expect(await store.resolveSession("")).toBeNull();
  });

  it("expires sessions and slides active ones", async () => {
    const store = authStore(db, now);
    const { id } = await store.createUser({ name: "Dev", email: "dev@x.ph", role: "DEV", password: "pw-1234567" });
    const { token } = await store.createSession(id);

    t += 3 * DAY; // plenty left: no write
    await store.resolveSession(token);
    expect((await db.session.findFirstOrThrow()).expiresAt.getTime()).toBe(new Date("2026-10-28T00:00:00Z").getTime() + SESSION_TTL_MS);

    t += 8 * DAY; // under 7 days left: pushed to a full TTL from now
    expect(await store.resolveSession(token)).not.toBeNull();
    expect((await db.session.findFirstOrThrow()).expiresAt.getTime()).toBe(t + SESSION_TTL_MS);

    t += SESSION_TTL_MS; // idle past expiry
    expect(await store.resolveSession(token)).toBeNull();
    expect(await db.session.count()).toBe(0);
  });

  it("signs out everywhere except the current device", async () => {
    const store = authStore(db, now);
    const { id } = await store.createUser({ name: "Dev", email: "dev@x.ph", role: "DEV", password: "pw-1234567" });
    const a = await store.createSession(id);
    const b = await store.createSession(id);

    await store.deleteUserSessions(id, a.token);
    expect(await store.resolveSession(a.token)).not.toBeNull();
    expect(await store.resolveSession(b.token)).toBeNull();

    await store.deleteSession(a.token);
    expect(await store.resolveSession(a.token)).toBeNull();
  });

  it("changes passwords", async () => {
    const store = authStore(db, now);
    const { id } = await store.createUser({ name: "Dev", email: "dev@x.ph", role: "DEV", password: "temp-pass-1" });
    await store.setPassword(id, "my-own-password", false);

    expect(await store.verifyUserPassword(id, "my-own-password")).toBe(true);
    expect(await store.verifyUserPassword(id, "temp-pass-1")).toBe(false);
    expect((await db.user.findUniqueOrThrow({ where: { id } })).mustChangePassword).toBe(false);
  });

  it("never lets the last active admin be demoted or turned off", async () => {
    const store = authStore(db, now);
    const a = await store.createUser({ name: "Admin A", email: "a@x.ph", role: "ADMIN", password: "pw-1234567" });

    expect(await store.wouldRemoveLastAdmin(a.id, { role: "DEV", active: true })).toBe(true);
    expect(await store.wouldRemoveLastAdmin(a.id, { role: "ADMIN", active: false })).toBe(true);
    expect(await store.wouldRemoveLastAdmin(a.id, { role: "ADMIN", active: true })).toBe(false);

    const b = await store.createUser({ name: "Admin B", email: "b@x.ph", role: "ADMIN", password: "pw-1234567" });
    expect(await store.wouldRemoveLastAdmin(a.id, { role: "QA", active: true })).toBe(false);

    await db.user.update({ where: { id: b.id }, data: { active: false } });
    expect(await store.wouldRemoveLastAdmin(a.id, { role: "QA", active: true })).toBe(true);
  });
});
