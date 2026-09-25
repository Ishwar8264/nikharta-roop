import type { z } from "zod";

import type { PlatformRole } from "@/generated/prisma/client";

import type {
  aiUsageStatsQuerySchema,
  listAiUsageQuerySchema,
  listUsersQuerySchema,
  updateAiBlockSchema,
  updateAiQuotaSchema,
  updateUserRoleSchema,
} from "./admin.schema";

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateAiBlockInput = z.infer<typeof updateAiBlockSchema>;
export type UpdateAiQuotaInput = z.infer<typeof updateAiQuotaSchema>;
export type ListAiUsageQuery = z.infer<typeof listAiUsageQuerySchema>;
export type AiUsageStatsQuery = z.infer<typeof aiUsageStatsQuerySchema>;

/**
 * Admin-facing user view.
 *
 * Why:
 * Includes `deletedAt` and platform-level state that customers never see.
 * Never includes the password hash or any credential material.
 */
export interface AdminUserView {
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
}

export interface PaginatedAdminUsers {
  items: AdminUserView[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Row shape for the AI usage log listing.
 *
 * Why:
 * `cost` is stored as a float USD estimate. Presenting it with a fixed
 * precision on the client is the client's job — the API returns the raw
 * number so a dashboard can round or aggregate as needed.
 */
export interface AdminAiUsageLog {
  id: string;
  userId: string;
  chatId: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  costUsd: number | null;
  contextType: string;
  createdAt: Date;
}

export interface PaginatedAiUsageLogs {
  items: AdminAiUsageLog[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** One row of an aggregated stats result. */
export interface AiUsageStatRow {
  key: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCostUsd: number;
  requestCount: number;
}

export interface AiUsageStats {
  groupBy: "model" | "day" | "user";
  rows: AiUsageStatRow[];
}
