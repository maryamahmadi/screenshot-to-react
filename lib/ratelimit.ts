export interface RateLimitResult {
  allowed: boolean;
  /** Requests still available in the current window. */
  remaining: number;
  /** Milliseconds until the next request would be allowed (0 when allowed). */
  retryAfterMs: number;
}

export interface RateLimiter {
  check(key: string, now?: number): RateLimitResult;
}

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
}

/**
 * In-memory sliding-window rate limiter.
 *
 * NOTE: state lives in the process, so on a multi-instance/serverless
 * deployment each instance limits independently. That's acceptable as a
 * lightweight abuse guard here; a shared store (e.g. Redis/Upstash) would be
 * the drop-in upgrade for strict global limits.
 */
export function createRateLimiter({
  limit,
  windowMs,
}: RateLimiterOptions): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    check(key, now = Date.now()): RateLimitResult {
      const windowStart = now - windowMs;
      const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);

      if (recent.length >= limit) {
        hits.set(key, recent);
        const retryAfterMs = recent[0] + windowMs - now;
        return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) };
      }

      recent.push(now);
      hits.set(key, recent);
      return { allowed: true, remaining: limit - recent.length, retryAfterMs: 0 };
    },
  };
}

/** Shared limiter for the generation endpoint, keyed by user id. */
export const generateRateLimiter = createRateLimiter({
  limit: Number(process.env.RATE_LIMIT_MAX ?? 10),
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
});
