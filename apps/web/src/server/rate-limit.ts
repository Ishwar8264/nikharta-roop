import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { AppError } from "@/server/errors";
import { getRedis } from "@/server/redis";

let limiter: Ratelimit | undefined;

/** Shared API budget, matching Improve India. Redis failure must not permit database work. */
export async function checkRateLimit(identifier: string) {
  try {
    limiter ??= new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      prefix: "nikharta-roop:api-rate-limit",
      analytics: false,
      timeout: 2000,
    });
    const result = await limiter.limit(identifier);
    // Upstash otherwise returns success when its timeout expires.
    if (result.reason === "timeout") throw new Error("API rate limit check timed out");
    return result;
  } catch {
    throw new AppError(
      "This service is temporarily unavailable. Please try again shortly.",
      "RATE_LIMIT_UNAVAILABLE",
      503,
    );
  }
}
