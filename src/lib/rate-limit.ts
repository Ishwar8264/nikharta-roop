import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstashConfig =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

if (process.env.NODE_ENV === "production" && !hasUpstashConfig) {
  throw new Error(
    "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production",
  );
}

// In production, Upstash provides a shared Redis so rate limits hold across
// every server instance. In local dev (or when Upstash is not configured) we
// fall back to an in-memory Map — it resets on every restart and does not
// share state across processes, which is fine for a single dev server.
const redis = hasUpstashConfig ? Redis.fromEnv() : undefined;

/** Sliding-window limiter that falls back to memory when Redis is absent. */
function createLimiter(config: {
  tokens: number;
  window: `${number} ${"s" | "m" | "h"}`;
  prefix: string;
}): Limiter {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.tokens, config.window),
      prefix: config.prefix,
      analytics: false,
    });
  }

  return new InMemoryLimiter(config.tokens, parseWindowMs(config.window));
}

export interface LimiterResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface Limiter {
  limit(identifier: string): Promise<LimiterResult>;
}

export const authLimiter = createLimiter({
  tokens: 10,
  window: "1 m",
  prefix: "ratelimit:auth",
});

export const standardLimiter = createLimiter({
  tokens: 60,
  window: "1 m",
  prefix: "ratelimit:standard",
});

export const authenticatedLimiter = createLimiter({
  tokens: 120,
  window: "1 m",
  prefix: "ratelimit:authenticated",
});

/** Builds the standard rate-limit response headers. */
export function rateLimitHeaders(result: {
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
    "Retry-After": String(
      Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    ),
  };
}

/** Minimal in-process limiter. Dev-only — not for multi-instance production. */
class InMemoryLimiter implements Limiter {
  private readonly store = new Map<string, { count: number; reset: number }>();

  constructor(
    private readonly tokens: number,
    private readonly windowMs: number,
  ) {}

  async limit(identifier: string): Promise<LimiterResult> {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || entry.reset <= now) {
      const reset = now + this.windowMs;
      this.store.set(identifier, { count: 1, reset });
      return {
        success: true,
        limit: this.tokens,
        remaining: this.tokens - 1,
        reset,
      };
    }

    entry.count += 1;
    return {
      success: entry.count <= this.tokens,
      limit: this.tokens,
      remaining: Math.max(0, this.tokens - entry.count),
      reset: entry.reset,
    };
  }
}

/** Converts an Upstash window literal ("1 m") into milliseconds. */
function parseWindowMs(window: string): number {
  const [amountStr, unit] = window.split(" ");
  const amount = Number(amountStr);
  if (unit === "s") return amount * 1000;
  if (unit === "h") return amount * 60 * 60 * 1000;
  return amount * 60 * 1000;
}
