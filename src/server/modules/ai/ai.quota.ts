import "server-only";

import { prisma } from "@/lib/prisma";

import { AiQuotaExceededError } from "./ai.errors";

/** Default limits for a newly-created user's AI quota row. */
const DEFAULT_LIMITS = {
  daily: 500,
  weekly: 3_000,
  monthly: 10_000,
} as const;

/**
 * Ensures the caller has a `UserAiUsage` row and returns it.
 *
 * Why:
 * The row carries the daily/weekly/monthly counters. Creating it on first
 * use keeps registration flow untouched and lets limit changes be applied
 * per-user without a migration.
 */
export async function ensureUsageRow(userId: string) {
  const existing = await prisma.userAiUsage.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  return prisma.userAiUsage.create({
    data: {
      userId,
      dailyLimit: DEFAULT_LIMITS.daily,
      dailyResetAt: nextDailyReset(),
      weeklyLimit: DEFAULT_LIMITS.weekly,
      weeklyResetAt: nextWeeklyReset(),
      monthlyLimit: DEFAULT_LIMITS.monthly,
      monthlyResetAt: nextMonthlyReset(),
    },
  });
}

/**
 * Rolls forward any windows whose reset time has passed.
 *
 * Why:
 * Quota counters are denormalized columns, not derived from logs. Resetting
 * them lazily on read avoids a background cron and keeps the read path fast.
 * A reset never un-blocks a user whose `isBlocked` flag is set — blocking is
 * an explicit admin action, not a side effect of a window rolling over.
 */
export async function rolloverExpiredWindows(userId: string) {
  const now = new Date();
  const row = await ensureUsageRow(userId);

  const data: Record<string, unknown> = {};

  if (row.dailyResetAt <= now) {
    data.dailyUsed = 0;
    data.dailyResetAt = nextDailyReset();
  }
  if (row.weeklyResetAt <= now) {
    data.weeklyUsed = 0;
    data.weeklyResetAt = nextWeeklyReset();
  }
  if (row.monthlyResetAt <= now) {
    data.monthlyUsed = 0;
    data.monthlyResetAt = nextMonthlyReset();
  }

  if (Object.keys(data).length === 0) return row;

  return prisma.userAiUsage.update({
    where: { userId },
    data,
  });
}

/**
 * Enforces the caller's quota. Throws a typed error when any dimension is
 * exhausted.
 *
 * Why:
 * Called before every streaming request. The blocked check comes first so an
 * admin-suspended account gets a specific message instead of a quota error.
 * The rollover runs first so a stale window does not unfairly reject.
 */
export async function enforceQuota(userId: string): Promise<void> {
  const row = await rolloverExpiredWindows(userId);

  if (row.isBlocked) {
    throw new AiQuotaExceededError({
      scope: "blocked",
      limit: 0,
      used: 0,
      resetAt: null,
    });
  }

  if (row.dailyUsed >= row.dailyLimit) {
    throw new AiQuotaExceededError({
      scope: "daily",
      limit: row.dailyLimit,
      used: row.dailyUsed,
      resetAt: row.dailyResetAt,
    });
  }
  if (row.weeklyUsed >= row.weeklyLimit) {
    throw new AiQuotaExceededError({
      scope: "weekly",
      limit: row.weeklyLimit,
      used: row.weeklyUsed,
      resetAt: row.weeklyResetAt,
    });
  }
  if (row.monthlyUsed >= row.monthlyLimit) {
    throw new AiQuotaExceededError({
      scope: "monthly",
      limit: row.monthlyLimit,
      used: row.monthlyUsed,
      resetAt: row.monthlyResetAt,
    });
  }
}

/**
 * Records a completed turn against the caller's counters.
 *
 * Why:
 * Runs inside the `onFinish` callback of the streaming response. Only
 * `totalTokens` is required — the AI SDK reports this on every completed
 * stream regardless of provider. Failures here are logged but never
 * propagate: the stream has already been delivered to the client and a
 * late DB blip must not surface as an error.
 */
export async function recordUsage(input: {
  userId: string;
  totalTokens: number;
}): Promise<void> {
  try {
    await prisma.userAiUsage.update({
      where: { userId: input.userId },
      data: {
        dailyUsed: { increment: input.totalTokens },
        weeklyUsed: { increment: input.totalTokens },
        monthlyUsed: { increment: input.totalTokens },
      },
    });
  } catch (error) {
    console.error("AI usage increment failed", input.userId, error);
  }
}

/** Next midnight UTC — the daily reset boundary. */
function nextDailyReset(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
    ),
  );
}

/** Next Monday 00:00 UTC. */
function nextWeeklyReset(): Date {
  const now = new Date();
  const daysUntilMonday = (8 - now.getUTCDay()) % 7 || 7;
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysUntilMonday,
      0,
      0,
      0,
    ),
  );
}

/** First day of next month 00:00 UTC. */
function nextMonthlyReset(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}
