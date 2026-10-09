/**
 * Browser-safe types for the admin feature.
 *
 * Why mirror instead of importing from `src/server/**`:
 * The wiring doc forbids importing server modules into Client Components, and
 * the server `AdminUserView` / `AdminAiUsageLog` types carry `Date` fields
 * that JSON-serialize to strings on the wire. Re-declaring the wire shape
 * here keeps the client types honest and lets the client bundle stay lean.
 */

import type { PlatformRole } from "@/generated/prisma/client";

/** Mirrors `AdminUserView` — dates become ISO strings over JSON. */
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
  deletedAt: string | null;
  createdAt: string;
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

/** Mirrors `AdminAiUsageLog`. */
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
  createdAt: string;
}

/** Mirrors `AiUsageStatRow`. */
export interface AiUsageStatRow {
  key: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCostUsd: number;
  requestCount: number;
}

/** Mirrors `AiUsageStats`. */
export interface AiUsageStats {
  groupBy: "model" | "day" | "user";
  rows: AiUsageStatRow[];
}

/** Mirrors `PublicAuditLog` — dates become ISO strings over JSON. */
export interface PublicAuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

/** Shape of every paginated admin list response. */
export interface PaginatedAdminResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Query params accepted by `listAdminUsersApi`. */
export interface ListAdminUsersQuery {
  cursor?: string;
  limit?: number;
  search?: string;
  role?: "SUPER_ADMIN" | "USER";
  includeDeleted?: boolean;
}

/** Body for `changeUserRoleApi`. */
export interface UpdateUserRoleBody {
  role: "SUPER_ADMIN" | "USER";
}

/** Body for `setUserAiBlockApi`. */
export interface UpdateAiBlockBody {
  isBlocked: boolean;
  reason?: string;
}

/** Body for `setUserAiQuotaApi`. */
export interface UpdateAiQuotaBody {
  dailyLimit?: number;
  weeklyLimit?: number;
  monthlyLimit?: number;
}
