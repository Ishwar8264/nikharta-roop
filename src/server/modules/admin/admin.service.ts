import "server-only";

import type { PlatformRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  AdminAccessDeniedError,
  AdminLastSuperAdminError,
  AdminQuotaBelowUsageError,
  AdminSelfDemotionError,
  AdminUserNotFoundError,
} from "./admin.errors";
import {
  aggregateUsageByDay,
  aggregateUsageByModel,
  aggregateUsageByUser,
  countSuperAdmins,
  findAdminUserById,
  listAiUsageLogs,
  listUsers,
  setAiBlockState,
  updateAiQuotaLimits,
  updateUserPlatformRole,
} from "./admin.repository";
import type {
  AdminAiUsageLog,
  AdminUserView,
  AiUsageStats,
  AiUsageStatsQuery,
  ListAiUsageQuery,
  ListUsersQuery,
  PaginatedAdminUsers,
  PaginatedAiUsageLogs,
  UpdateAiBlockInput,
  UpdateAiQuotaInput,
  UpdateUserRoleInput,
} from "./admin.types";

/** Rejects anyone who is not a SUPER_ADMIN. */
function assertSuperAdmin(role: string): void {
  if (role !== "SUPER_ADMIN") throw new AdminAccessDeniedError();
}

/**
 * Normalizes a repository user row into the admin view.
 *
 * Why:
 * The repository returns `Prisma.Decimal` for the loyalty points field on
 * some Prisma versions. Coercing to number here keeps the response stable
 * regardless of the driver.
 */
function toAdminUserView(row: {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  avatar: string | null;
  role: PlatformRole;
  emailVerified: boolean;
  phoneVerified: boolean;
  loyaltyPoints: number;
  isOnboarded: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  aiUsage: {
    isBlocked: boolean;
    blockReason: string | null;
    dailyUsed: number;
    dailyLimit: number;
    weeklyUsed: number;
    weeklyLimit: number;
    monthlyUsed: number;
    monthlyLimit: number;
  } | null;
}): AdminUserView {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    name: row.name,
    avatar: row.avatar,
    role: row.role,
    emailVerified: row.emailVerified,
    phoneVerified: row.phoneVerified,
    loyaltyPoints: Number(row.loyaltyPoints),
    isOnboarded: row.isOnboarded,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    aiUsage: row.aiUsage,
  };
}

/** Lists users for the admin dashboard. SUPER_ADMIN only. */
export async function listAdminUsers(
  callerRole: string,
  query: ListUsersQuery,
): Promise<PaginatedAdminUsers> {
  assertSuperAdmin(callerRole);

  const result = await listUsers(query);
  return {
    items: result.items.map(toAdminUserView),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/**
 * Changes a user's platform role.
 *
 * Why:
 * Two invariants must hold:
 *   1. A SUPER_ADMIN cannot demote themselves — this prevents accidentally
 *      locking yourself out of the admin surface.
 *   2. The platform must always retain at least one active SUPER_ADMIN.
 *
 * The check and the write run inside a transaction so two concurrent
 * demotions cannot both pass the "one remains" check.
 */
export async function changeUserRole(
  callerId: string,
  callerRole: string,
  targetUserId: string,
  input: UpdateUserRoleInput,
): Promise<AdminUserView> {
  assertSuperAdmin(callerRole);

  if (callerId === targetUserId && input.role !== "SUPER_ADMIN") {
    throw new AdminSelfDemotionError();
  }

  const target = await findAdminUserById(targetUserId);
  if (!target) throw new AdminUserNotFoundError();

  // Only guard the "one remains" invariant when demoting an existing admin.
  if (target.role === "SUPER_ADMIN" && input.role !== "SUPER_ADMIN") {
    await prisma.$transaction(async (tx) => {
      const remaining = await countSuperAdmins(tx);
      if (remaining <= 1) throw new AdminLastSuperAdminError();
      await tx.user.update({
        where: { id: targetUserId },
        data: { role: input.role },
      });
    });
    const refreshed = await findAdminUserById(targetUserId);
    if (!refreshed) throw new AdminUserNotFoundError();
    return toAdminUserView(refreshed);
  }

  const updated = await updateUserPlatformRole(targetUserId, input.role);
  return toAdminUserView(updated);
}

/**
 * Blocks or unblocks a user from the AI feature.
 *
 * Why:
 * Blocking a user mid-conversation should stop the next request immediately
 * — that is why the flag lives on the usage row that every streaming call
 * already reads. Unblocking clears the reason so a stale justification is
 * not carried forward.
 */
export async function setUserAiBlock(
  callerRole: string,
  targetUserId: string,
  input: UpdateAiBlockInput,
): Promise<AdminUserView> {
  assertSuperAdmin(callerRole);

  const target = await findAdminUserById(targetUserId);
  if (!target) throw new AdminUserNotFoundError();

  await setAiBlockState({
    userId: targetUserId,
    isBlocked: input.isBlocked,
    reason: input.isBlocked ? (input.reason ?? null) : null,
  });

  const refreshed = await findAdminUserById(targetUserId);
  if (!refreshed) throw new AdminUserNotFoundError();
  return toAdminUserView(refreshed);
}

/**
 * Adjusts a user's AI quota limits.
 *
 * Why:
 * A new limit below the amount already used would leave the user in a
 * permanently-exhausted state on their next request. Rather than silently
 * accept that, we surface the conflict so the admin can choose a value
 * above the current usage or reset the counters first.
 */
export async function setUserAiQuota(
  callerRole: string,
  targetUserId: string,
  input: UpdateAiQuotaInput,
): Promise<AdminUserView> {
  assertSuperAdmin(callerRole);

  const target = await findAdminUserById(targetUserId);
  if (!target) throw new AdminUserNotFoundError();

  const usage = target.aiUsage;
  if (usage) {
    if (input.dailyLimit !== undefined && input.dailyLimit < usage.dailyUsed) {
      throw new AdminQuotaBelowUsageError("daily", usage.dailyUsed);
    }
    if (
      input.weeklyLimit !== undefined &&
      input.weeklyLimit < usage.weeklyUsed
    ) {
      throw new AdminQuotaBelowUsageError("weekly", usage.weeklyUsed);
    }
    if (
      input.monthlyLimit !== undefined &&
      input.monthlyLimit < usage.monthlyUsed
    ) {
      throw new AdminQuotaBelowUsageError("monthly", usage.monthlyUsed);
    }
  }

  await updateAiQuotaLimits({
    userId: targetUserId,
    dailyLimit: input.dailyLimit,
    weeklyLimit: input.weeklyLimit,
    monthlyLimit: input.monthlyLimit,
  });

  const refreshed = await findAdminUserById(targetUserId);
  if (!refreshed) throw new AdminUserNotFoundError();
  return toAdminUserView(refreshed);
}

/** Lists raw AI usage log rows. SUPER_ADMIN only. */
export async function listAdminAiUsageLogs(
  callerRole: string,
  query: ListAiUsageQuery,
): Promise<PaginatedAiUsageLogs> {
  assertSuperAdmin(callerRole);

  const result = await listAiUsageLogs(query);
  const items: AdminAiUsageLog[] = result.items.map((row) => ({
    id: row.id,
    userId: row.userId,
    chatId: row.chatId,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    totalTokens: row.totalTokens,
    model: row.model,
    costUsd: row.cost,
    contextType: row.contextType,
    createdAt: row.createdAt,
  }));

  return {
    items,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/**
 * Returns aggregated usage stats for the admin cost dashboard.
 *
 * Why:
 * The three groupings answer the three questions the admin actually asks:
 * which model costs the most, which days are heaviest, and which users are
 * the top consumers. Adding a new grouping is one switch case.
 */
export async function getAdminAiUsageStats(
  callerRole: string,
  query: AiUsageStatsQuery,
): Promise<AiUsageStats> {
  assertSuperAdmin(callerRole);

  const from = query.from ? new Date(query.from) : undefined;
  const to = query.to ? new Date(query.to) : undefined;

  if (query.groupBy === "model") {
    const rows = await aggregateUsageByModel({ from, to });
    return { groupBy: "model", rows };
  }
  if (query.groupBy === "user") {
    const rows = await aggregateUsageByUser({ from, to });
    return { groupBy: "user", rows };
  }

  const rows = await aggregateUsageByDay({ from, to });
  return { groupBy: "day", rows };
}
