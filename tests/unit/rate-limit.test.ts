import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/auth/rate-limit";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { createTestDb } from "./helpers/test-db";

let db: PrismaClient;
let cleanup: () => Promise<void>;
let t = 0;
const now = () => new Date(t);

beforeAll(async () => {
  ({ db, cleanup } = await createTestDb());
});

afterAll(async () => {
  await cleanup();
});

beforeEach(async () => {
  await db.rateLimitHit.deleteMany();
  t = new Date("2026-10-30T00:00:00Z").getTime();
});

describe("rate limiter (database)", () => {
  it("blocks after max failures until the oldest leaves the window", async () => {
    const start = t;
    const rl = createRateLimiter(db, { name: "login", max: 3, windowMs: 60_000, now });
    await rl.fail("a");
    await rl.fail("a");
    expect(await rl.blockedFor("a")).toBe(0);
    await rl.fail("a");
    expect(await rl.blockedFor("a")).toBe(60);
    expect(await rl.blockedFor("b")).toBe(0);
    t = start + 59_000;
    expect(await rl.blockedFor("a")).toBe(1);
    t = start + 60_000;
    expect(await rl.blockedFor("a")).toBe(0);
  });

  it("counts only hits inside the window", async () => {
    const rl = createRateLimiter(db, { name: "login", max: 2, windowMs: 1000, now });
    await rl.fail("a");
    t += 5000;
    await rl.fail("a");
    expect(await rl.blockedFor("a")).toBe(0);
  });

  it("resets on success", async () => {
    const rl = createRateLimiter(db, { name: "login", max: 1, windowMs: 1000, now });
    await rl.fail("a");
    expect(await rl.blockedFor("a")).toBeGreaterThan(0);
    await rl.reset("a");
    expect(await rl.blockedFor("a")).toBe(0);
  });

  it("keeps limiters with different names apart", async () => {
    const login = createRateLimiter(db, { name: "login", max: 1, windowMs: 1000, now });
    const signup = createRateLimiter(db, { name: "signup", max: 1, windowMs: 1000, now });
    await login.fail("all");
    expect(await login.blockedFor("all")).toBeGreaterThan(0);
    expect(await signup.blockedFor("all")).toBe(0);
  });
});
