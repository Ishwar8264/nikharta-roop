/**
 * Client-side API wrappers for the admin surfaces.
 *
 * Why a single module:
 * Every admin surface is small (users, coupons, ai-usage, audit-logs) and all
 * routes share the `/admin/*` prefix and the `PaginatedAdminResult<T>` shape.
 * One file per surface would mean four near-identical modules; one file with
 * clearly-grouped functions keeps the surface area small and lets a single
 * import line serve any admin client component.
 */

import { api } from "@/lib/api/backend.client";

import type {
  AdminAiUsageLog,
  AdminUserView,
  AiUsageStats,
  ListAdminUsersQuery,
  PublicAuditLog,
  UpdateAiBlockBody,
  UpdateAiQuotaBody,
  UpdateUserRoleBody,
} from "./types";

// ─── Users ───

type ListUsersResponse = {
  message: string;
  data: AdminUserView[];
  meta: { nextCursor: string | null; hasMore: boolean };
};

type UserMutationResponse = {
  message: string;
  data: { user: AdminUserView };
};

/** Lists platform users. SUPER_ADMIN only. */
export function listAdminUsersApi(query: ListAdminUsersQuery = {}) {
  const params = new URLSearchParams();
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.role) params.set("role", query.role);
  if (query.includeDeleted !== undefined) {
    params.set("includeDeleted", String(query.includeDeleted));
  }
  const qs = params.toString();
  return api.get<ListUsersResponse>(`/admin/users${qs ? `?${qs}` : ""}`);
}

/** Changes a user's platform role. SUPER_ADMIN only. */
export function changeUserRoleApi(userId: string, body: UpdateUserRoleBody) {
  return api.patch<UserMutationResponse>(
    `/admin/users/${encodeURIComponent(userId)}/role`,
    body,
  );
}

/** Blocks or unblocks a user from the AI feature. SUPER_ADMIN only. */
export function setUserAiBlockApi(userId: string, body: UpdateAiBlockBody) {
  return api.patch<UserMutationResponse>(
    `/admin/users/${encodeURIComponent(userId)}/ai-block`,
    body,
  );
}

/** Adjusts a user's AI quota limits. SUPER_ADMIN only. */
export function setUserAiQuotaApi(userId: string, body: UpdateAiQuotaBody) {
  return api.patch<UserMutationResponse>(
    `/admin/users/${encodeURIComponent(userId)}/ai-quota`,
    body,
  );
}

// ─── AI usage ───

type ListAiUsageResponse = {
  message: string;
  data: AdminAiUsageLog[];
  meta: { nextCursor: string | null; hasMore: boolean };
};

type AiUsageStatsResponse = {
  message: string;
  data: AiUsageStats;
};

/** Lists raw AI usage log rows. SUPER_ADMIN only. */
export function listAdminAiUsageLogsApi(
  query: {
    cursor?: string;
    limit?: number;
    userId?: string;
    model?: string;
    from?: string;
    to?: string;
  } = {},
) {
  const params = new URLSearchParams();
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.userId) params.set("userId", query.userId);
  if (query.model) params.set("model", query.model);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  const qs = params.toString();
  return api.get<ListAiUsageResponse>(`/admin/ai-usage${qs ? `?${qs}` : ""}`);
}

/** Returns aggregated AI usage stats grouped by model / day / user. */
export function getAdminAiUsageStatsApi(
  query: {
    from?: string;
    to?: string;
    groupBy?: "model" | "day" | "user";
  } = {},
) {
  const params = new URLSearchParams();
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.groupBy) params.set("groupBy", query.groupBy);
  const qs = params.toString();
  return api.get<AiUsageStatsResponse>(
    `/admin/ai-usage/stats${qs ? `?${qs}` : ""}`,
  );
}

// ─── Audit logs ───

type ListAuditLogsResponse = {
  message: string;
  data: PublicAuditLog[];
  meta: { nextCursor: string | null; hasMore: boolean };
};

/** Lists audit log entries. SUPER_ADMIN only. */
export function listAuditLogsApi(
  query: {
    cursor?: string;
    limit?: number;
    entity?: string;
    entityId?: string;
    userId?: string;
    action?: "CREATE" | "UPDATE" | "DELETE";
    from?: string;
    to?: string;
  } = {},
) {
  const params = new URLSearchParams();
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.entity) params.set("entity", query.entity);
  if (query.entityId) params.set("entityId", query.entityId);
  if (query.userId) params.set("userId", query.userId);
  if (query.action) params.set("action", query.action);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  const qs = params.toString();
  return api.get<ListAuditLogsResponse>(`/audit-logs${qs ? `?${qs}` : ""}`);
}

/** Loads a single audit log entry. SUPER_ADMIN only. */
export function getAuditLogApi(logId: string) {
  return api.get<{ message: string; data: { log: PublicAuditLog } }>(
    `/audit-logs/${encodeURIComponent(logId)}`,
  );
}
