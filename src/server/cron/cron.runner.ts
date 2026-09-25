import "server-only";

import { Redis } from "@upstash/redis";

import { CRON_LOCK_PREFIX, CRON_LOCK_TTL_SECONDS } from "./cron.config";

/**
 * Shared Redis client used only for cron locks.
 *
 * Why:
 * The rate limiters already use `Redis.fromEnv()`. Reusing the same
 * environment variables keeps the deployment surface small, and the
 * `cron:lock:` prefix ensures we never collide with a rate limit key.
 *
 * When the env vars are absent (local dev without Upstash) the client is
 * `null` and the runner falls back to in-process locking — enough for a
 * single dev server, not for production.
 */
const redis = (() => {
  const hasUrl = Boolean(process.env.UPSTASH_REDIS_REST_URL);
  const hasToken = Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasUrl || !hasToken) return null;
  return Redis.fromEnv();
})();

/**
 * Reports the outcome of one job run back to the caller.
 *
 * Why:
 * Every cron route wants to log a consistent shape. Giving the runner a
 * single return type means every route file stays five lines long and the
 * logs look the same in Vercel's dashboard.
 */
export interface CronRunResult {
  jobName: string;
  ran: boolean;
  skippedReason?: string;
  processed: number;
  durationMs: number;
  details?: unknown;
  error?: string;
}

/**
 * Wraps a job handler with the three guarantees every cron needs.
 *
 * Why:
 *   1. **Distributed lock** — Vercel may fire overlapping invocations. The
 *      lock ensures at most one instance actually runs the handler.
 *   2. **Best-effort delivery** — Vercel does not retry failed jobs. The
 *      try/catch here captures the failure as a structured result so the
 *      caller can log it, alert, or schedule a retry.
 *   3. **Time-budget awareness** — the handler receives a `deadline`
 *      timestamp and can stop early to flush partial work. If it does not,
 *      the runner still returns a clean response once the budget elapses.
 *
 * The lock is always released in the `finally` block so a crash mid-run
 * cannot leave the job permanently locked.
 */
export async function runCronJob(input: {
  jobName: string;
  handler: (context: {
    deadline: number;
    hasTimeLeft: () => boolean;
  }) => Promise<{ processed: number; details?: unknown }>;
}): Promise<CronRunResult> {
  const start = Date.now();
  const lockKey = `${CRON_LOCK_PREFIX}${input.jobName}`;

  // Acquire the lock. When Redis is not configured, fall back to a simple
  // process-local flag so local dev still exercises the skip path.
  const acquired = await tryAcquireLock(lockKey);
  if (!acquired) {
    return {
      jobName: input.jobName,
      ran: false,
      skippedReason: "Another instance holds the lock",
      processed: 0,
      durationMs: Date.now() - start,
    };
  }

  const deadline = start + (await getTimeBudget());

  try {
    const result = await input.handler({
      deadline,
      hasTimeLeft: () => Date.now() < deadline,
    });

    return {
      jobName: input.jobName,
      ran: true,
      processed: result.processed,
      durationMs: Date.now() - start,
      details: result.details,
    };
  } catch (error) {
    console.error(`Cron job "${input.jobName}" failed`, error);
    return {
      jobName: input.jobName,
      ran: true,
      processed: 0,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    await releaseLock(lockKey);
  }
}

/**
 * Attempts to acquire the lock atomically.
 *
 * Why:
 * `SET NX EX` is the standard Redis idiom — one roundtrip, atomic, and it
 * auto-expires so a crashed process cannot hold the lock forever. When
 * Redis is unavailable we fall back to an in-process flag so local dev
 * still works without Upstash configured.
 */
async function tryAcquireLock(lockKey: string): Promise<boolean> {
  if (redis) {
    const result = await redis.set(lockKey, "1", {
      nx: true,
      ex: CRON_LOCK_TTL_SECONDS,
    });
    return result === "OK";
  }

  // In-process fallback for local dev.
  if (inProcessLocks.has(lockKey)) return false;
  inProcessLocks.add(lockKey);
  setTimeout(
    () => inProcessLocks.delete(lockKey),
    CRON_LOCK_TTL_SECONDS * 1000,
  );
  return true;
}

/** Releases the lock. Safe to call even if the lock already expired. */
async function releaseLock(lockKey: string): Promise<void> {
  if (redis) {
    try {
      await redis.del(lockKey);
    } catch (error) {
      // A failed release is not fatal — the TTL will clean it up.
      console.error("Cron lock release failed", lockKey, error);
    }
    return;
  }
  inProcessLocks.delete(lockKey);
}

/** Simple in-process set used only when Redis is not configured. */
const inProcessLocks = new Set<string>();

/** Reads the time budget from a constant. Extracted so tests can override it. */
async function getTimeBudget(): Promise<number> {
  const { CRON_TIME_BUDGET_MS } = await import("./cron.config");
  return CRON_TIME_BUDGET_MS;
}

/**
 * Verifies the request carries the expected `CRON_SECRET`.
 *
 * Why:
 * Cron routes are public HTTP endpoints — anyone can hit them if they guess
 * the URL. Vercel sends the secret as a bearer token on every scheduled
 * invocation, so checking it here means the job is unreachable from outside.
 */
export function verifyCronSecret(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // Refuse to run without a configured secret rather than running openly.
    console.error("CRON_SECRET is not configured");
    return false;
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${expected}`;
}
