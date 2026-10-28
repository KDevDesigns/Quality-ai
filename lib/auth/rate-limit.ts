/** In-memory fixed-window limiter for failed logins. Resets when the server restarts, which is fine for a LAN app. */
export function createRateLimiter({ max, windowMs, now = Date.now }: { max: number; windowMs: number; now?: () => number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  function current(key: string) {
    const h = hits.get(key);
    if (h && h.resetAt <= now()) {
      hits.delete(key);
      return undefined;
    }
    return h;
  }

  return {
    /** Seconds until the key may try again, or 0 when it isn't blocked. */
    blockedFor(key: string): number {
      const h = current(key);
      return h && h.count >= max ? Math.ceil((h.resetAt - now()) / 1000) : 0;
    },
    fail(key: string) {
      const h = current(key);
      if (h) h.count++;
      else hits.set(key, { count: 1, resetAt: now() + windowMs });
      if (hits.size > 10_000) for (const k of hits.keys()) if (!current(k)) hits.delete(k);
    },
    reset(key: string) {
      hits.delete(key);
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;
