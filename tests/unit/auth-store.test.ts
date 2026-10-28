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

    expect(await store.checkCredentials("ANA@example.gov.ph", "temp-pass-123")).toMatchObject({ name: "Ana QA", role: "QA", mustChangePassword: true });
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
