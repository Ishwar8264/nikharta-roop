import "server-only";

/**
 * Global time budget for every cron handler.
 *
 * Why:
 * Vercel's function timeout is 60s on Hobby and 900s on Pro. Handlers should
 * stop *before* the platform kills them so they can flush partial work and
 * return a useful 200. 50s leaves a comfortable buffer on Hobby and works
 * unchanged on Pro.
 */
export const CRON_TIME_BUDGET_MS = 50_000;

/** How long the distributed lock is held before it auto-expires. */
export const CRON_LOCK_TTL_SECONDS = 55;

/**
 * Prefix for every lock key so the same Redis can host other keyspaces.
 *
 * Why:
 * `@upstash/redis` shares the same database as the rate limiters. Namespacing
 * keeps a `KEYS` scan readable and lets us drop every cron lock at once if
 * a deploy goes wrong.
 */
export const CRON_LOCK_PREFIX = "cron:lock:";

/**
 * Schedules for every job.
 *
 * Why:
 * Kept in one file so `vercel.json` can be regenerated from source, and so
 * a reviewer sees the entire cadence in one place. The expressions are
 * chosen to work on both Hobby and Pro — daily schedules use the same
 * form that works everywhere, while hourly and every-few-minutes jobs
 * simply run less often on Hobby (Vercel runs what it can).
 */
export const CRON_SCHEDULES = {
  appointmentReminders: "0 * * * *", // hourly
  notificationRetry: "*/15 * * * *", // every 15 minutes
  blogPublish: "*/5 * * * *", // every 5 minutes
} as const;

export type CronJobName = keyof typeof CRON_SCHEDULES;
