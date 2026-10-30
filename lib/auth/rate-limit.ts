import type { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Sliding-window limiter for failed sign-ins and sign-ups. Hits live in the database because serverless functions
 * share no memory: a Map would reset with every new instance and never block anyone.
 */
export function createRateLimiter(
  db: PrismaClient,
  { name, max, windowMs, now = () => new Date() }: { name: string; max: number; windowMs: number; now?: () => Date },
) {
  const keyOf = (key: string) => `${name}:${key}`;
  const since = () => new Date(now().getTime() - windowMs);

  return {
    /** Seconds until the key may try again, or 0 when it isn't blocked. */
    async blockedFor(key: string): Promise<number> {
      const hits = await db.rateLimitHit.findMany({
        where: { key: keyOf(key), at: { gt: since() } },
        orderBy: { at: "desc" },
        take: max,
        select: { at: true },
      });
      if (hits.length < max) return 0;
      // Blocked until the oldest of the last `max` hits leaves the window.
      return Math.max(1, Math.ceil((hits[max - 1].at.getTime() + windowMs - now().getTime()) / 1000));
    },
    async fail(key: string) {
      await db.rateLimitHit.create({ data: { key: keyOf(key), at: now() } });
    },
    async reset(key: string) {
      await db.rateLimitHit.deleteMany({ where: { key: keyOf(key) } });
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;

/** Hits older than this can't affect any limiter; the daily clean-up removes them. */
export const RATE_LIMIT_KEEP_MS = 24 * 60 * 60 * 1000;
