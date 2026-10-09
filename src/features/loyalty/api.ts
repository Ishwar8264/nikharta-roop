/**
 * Client-side API wrappers for the loyalty feature.
 *
 * Routes through the shared `api` client so CSRF + cookie auth + refresh-
 * on-401 are handled by `backend.client`.
 */

import { api } from "@/lib/api/backend.client";

import type {
  LoyaltyBalance,
  PaginatedTransactions,
  RedeemResult,
} from "./types";

/** Loads the caller's loyalty balance. */
export function getBalanceApi() {
  return api.get<{ message: string; data: { balance: LoyaltyBalance } }>(
    "/loyalty/balance",
  );
}

/** Lists the caller's loyalty transactions. */
export function listTransactionsApi(query: { cursor?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  const qs = params.toString();
  return api.get<{
    message: string;
    data: PaginatedTransactions["items"];
    meta: { nextCursor: string | null; hasMore: boolean };
  }>(`/loyalty/transactions${qs ? `?${qs}` : ""}`);
}

/** Redeems points for a discount coupon. */
export function redeemPointsApi(input: {
  points: number;
  appointmentId?: string;
  description?: string;
}) {
  return api.post<{ message: string; data: RedeemResult }>(
    "/loyalty/redeem",
    input,
  );
}
