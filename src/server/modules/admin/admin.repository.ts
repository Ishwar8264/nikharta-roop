import "server-only";

import type { PlatformRole, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * User select used by the admin listing.
 *
 * Why:
 * The admin view needs the AI usage row inline so the caller can render a
 * "blocked" badge and quota meters without a second request per user. The
 * select deliberately excludes password, refresh tokens, and any other
 * credential material.
 */
const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  phone: true,
  name: true,
  avatar: true,
  role: true,
  emailVerified: true,
  phoneVerified: true,
  loyaltyPoints: true,
  isOnboarded: true,
  deletedAt: true,
  createdAt: true,
  aiUsage: {
    select: {
      isBlocked: true,
      blockReason: true,
      dailyUsed: true,
      dailyLimit: true,
      weeklyUsed: true,
      weeklyLimit: true,
      monthlyUsed: true,
      monthlyLimit: true,
    },
  },
} as const satisfies Prisma.UserSelect;

/**
 * Cursor-paginated user list.
 *
 * Why:
 * Search is case-insensitive across email and name so an admin can paste
 * either identifier. `includeDeleted` is off by default because abuse
 * investigations are the exception, not the rule.
 */
export async function listUsers(input: {
  cursor?: string;
  limit: number;
  search?: string;
  role?: PlatformRole;
  includeDeleted?: boolean;
}) {
  const where: Prisma.UserWhereInput = {
    ...(input.includeDeleted ? {} : { deletedAt: null }),
    ...(input.role ? { role: input.role } : {}),
    ...(input.search
      ? {
          OR: [
            { email: { contains: input.search, mode: "insensitive" } },
            { name: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await prisma.user.findMany({
    where,
    select: ADMIN_USER_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/** Loads a single user with the admin select. */
export async function findAdminUserById(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId },
    select: ADMIN_USER_SELECT,
  });
}

/** Updates a user's platform role. */
export async function updateUserPlatformRole(
  userId: string,
  role: PlatformRole,
) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: ADMIN_USER_SELECT,
  });
}

/**
 * Counts active SUPER_ADMIN users.
 *
 * Why:
 * The demotion guard needs to know how many remain after the change. A
 * count is cheaper than loading rows and lets the check be a single
 * roundtrip inside the transaction.
 */
export async function countSuperAdmins(
  transaction: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<number> {
  return transaction.user.count({
    where: { role: "SUPER_ADMIN", deletedAt: null },
  });
}

/**
 * Sets or clears the AI block flag.
 *
 * Why:
 * The row may not exist yet for a user who never used AI. An upsert keeps
 * the call site simple: the admin endpoint is always "make this user's
 * block state equal to X", regardless of whether they had a row before.
 */
export async function setAiBlockState(input: {
  userId: string;
  isBlocked: boolean;
  reason: string | null;
}) {
  return prisma.userAiUsage.upsert({
    where: { userId: input.userId },
    update: {
      isBlocked: input.isBlocked,
      blockReason: input.reason,
    },
    create: {
      userId: input.userId,
      isBlocked: input.isBlocked,
      blockReason: input.reason,
      dailyResetAt: nextDailyReset(),
      weeklyResetAt: nextWeeklyReset(),
      monthlyResetAt: nextMonthlyReset(),
    },
  });
}

/**
 * Updates quota limits on the AI usage row.
 *
 * Why:
 * Upsert for the same reason as `setAiBlockState` — a fresh user might not
 * have a row, and the admin endpoint should still succeed. Only the fields
 * actually supplied are changed on an existing row.
 */
export async function updateAiQuotaLimits(input: {
  userId: string;
  dailyLimit?: number;
  weeklyLimit?: number;
  monthlyLimit?: number;
}) {
  return prisma.userAiUsage.upsert({
    where: { userId: input.userId },
    update: {
      ...(input.dailyLimit !== undefined
        ? { dailyLimit: input.dailyLimit }
        : {}),
      ...(input.weeklyLimit !== undefined
        ? { weeklyLimit: input.weeklyLimit }
        : {}),
      ...(input.monthlyLimit !== undefined
        ? { monthlyLimit: input.monthlyLimit }
        : {}),
    },
    create: {
      userId: input.userId,
      dailyLimit: input.dailyLimit ?? 500,
      weeklyLimit: input.weeklyLimit ?? 3_000,
      monthlyLimit: input.monthlyLimit ?? 10_000,
      dailyResetAt: nextDailyReset(),
      weeklyResetAt: nextWeeklyReset(),
      monthlyResetAt: nextMonthlyReset(),
    },
  });
}

/** Cursor-paginated AI usage log listing. */
export async function listAiUsageLogs(input: {
  cursor?: string;
  limit: number;
  userId?: string;
  model?: string;
  from?: string;
  to?: string;
}) {
  const where: Prisma.AiUsageLogWhereInput = {
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.model ? { model: input.model } : {}),
    ...(input.from || input.to
      ? {
          createdAt: {
            ...(input.from ? { gte: new Date(input.from) } : {}),
            ...(input.to ? { lte: new Date(input.to) } : {}),
          },
        }
      : {}),
  };

  const rows = await prisma.aiUsageLog.findMany({
    where,
    select: {
      id: true,
      userId: true,
      chatId: true,
      inputTokens: true,
      outputTokens: true,
      totalTokens: true,
      model: true,
      cost: true,
      contextType: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/**
 * Aggregated usage by model.
 *
 * Why:
 * Prisma `groupBy` handles this in the database — no rows travel over the
 * wire for what is ultimately a small summary. The results drive the
 * admin cost dashboard.
 */
export async function aggregateUsageByModel(input: { from?: Date; to?: Date }) {
  const grouped = await prisma.aiUsageLog.groupBy({
    by: ["model"],
    where: buildTimeFilter(input),
    _sum: {
      inputTokens: true,
      outputTokens: true,
      totalTokens: true,
      cost: true,
    },
    _count: { _all: true },
    orderBy: { _sum: { totalTokens: "desc" } },
  });

  return grouped.map((row) => ({
    key: row.model,
    totalTokens: row._sum.totalTokens ?? 0,
    inputTokens: row._sum.inputTokens ?? 0,
    outputTokens: row._sum.outputTokens ?? 0,
    totalCostUsd: row._sum.cost ?? 0,
    requestCount: row._count._all,
  }));
}

/** Aggregated usage by user. */
export async function aggregateUsageByUser(input: { from?: Date; to?: Date }) {
  const grouped = await prisma.aiUsageLog.groupBy({
    by: ["userId"],
    where: buildTimeFilter(input),
    _sum: {
      inputTokens: true,
      outputTokens: true,
      totalTokens: true,
      cost: true,
    },
    _count: { _all: true },
    orderBy: { _sum: { totalTokens: "desc" } },
    take: 100,
  });

  return grouped.map((row) => ({
    key: row.userId,
    totalTokens: row._sum.totalTokens ?? 0,
    inputTokens: row._sum.inputTokens ?? 0,
    outputTokens: row._sum.outputTokens ?? 0,
    totalCostUsd: row._sum.cost ?? 0,
    requestCount: row._count._all,
  }));
}

/**
 * Aggregated usage by day via raw SQL.
 *
 * Why:
 * Prisma has no first-class "group by date_trunc" support. The raw query is
 * bounded by the from/to filter and runs against an indexed table, so it
 * stays fast even as the log grows.
 */
export async function aggregateUsageByDay(input: { from?: Date; to?: Date }) {
  const rows = await prisma.$queryRaw<
    Array<{
      day: Date;
      input_tokens: bigint;
      output_tokens: bigint;
      total_tokens: bigint;
      total_cost: number | null;
      request_count: bigint;
    }>
  >`
    SELECT
      DATE_TRUNC('day', "createdAt") AS day,
      COALESCE(SUM("inputTokens"), 0) AS input_tokens,
      COALESCE(SUM("outputTokens"), 0) AS output_tokens,
      COALESCE(SUM("totalTokens"), 0) AS total_tokens,
      COALESCE(SUM(cost), 0) AS total_cost,
      COUNT(*) AS request_count
    FROM "AiUsageLog"
    WHERE 1 = 1
      ${input.from ? prisma.$queryRaw`AND "createdAt" >= ${input.from}` : prisma.$queryRaw``}
      ${input.to ? prisma.$queryRaw`AND "createdAt" <= ${input.to}` : prisma.$queryRaw``}
    GROUP BY day
    ORDER BY day DESC
    LIMIT 90
  `;

  return rows.map((row) => ({
    key: row.day.toISOString().slice(0, 10),
    totalTokens: Number(row.total_tokens),
    inputTokens: Number(row.input_tokens),
    outputTokens: Number(row.output_tokens),
    totalCostUsd: Number(row.total_cost ?? 0),
    requestCount: Number(row.request_count),
  }));
}

// ---------- helpers ----------

/** Builds the shared time-range filter for aggregate queries. */
function buildTimeFilter(input: { from?: Date; to?: Date }) {
  if (!input.from && !input.to) return {};
  return {
    createdAt: {
      ...(input.from ? { gte: input.from } : {}),
      ...(input.to ? { lte: input.to } : {}),
    },
  };
}

/** Same reset boundaries used by the customer-facing AI quota module. */
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

function nextMonthlyReset(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}
