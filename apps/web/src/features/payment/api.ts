import { api } from "@/lib/api/backend.client";

export type PaymentTxnType = "ADVANCE" | "FINAL" | "REFUND";
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "WALLET" | "ONLINE";

/** Mirrors `PublicPaymentTransaction` (dates serialize to strings over JSON). */
export interface PaymentTransaction {
  id: string;
  appointmentId: string;
  type: PaymentTxnType;
  amount: number;
  commission: number;
  method: PaymentMethod;
  gatewayRef: string | null;
  createdAt: string;
}

/** Lists an appointment's transactions. */
export function listTransactionsApi(appointmentId: string) {
  return api.get<{
    message: string;
    data: PaymentTransaction[];
    meta: { nextCursor: string | null; hasMore: boolean };
  }>(
    `/appointments/${encodeURIComponent(appointmentId)}/transactions`,
  );
}

/**
 * Records an advance/final/refund transaction.
 *
 * Why the caller supplies the idempotency key:
 * Retries reuse the same key, so the backend turns a double-submit into a
 * 409 ("already recorded") instead of a second charge. Callers should
 * generate one key per logical payment attempt and keep it for retries.
 */
export function recordTransactionApi(
  appointmentId: string,
  body: {
    type: PaymentTxnType;
    amount: number;
    method: PaymentMethod;
    commission?: number;
    gatewayRef?: string;
    idempotencyKey: string;
  },
) {
  return api.post<{
    message: string;
    data: { transaction: PaymentTransaction };
  }>(
    `/appointments/${encodeURIComponent(appointmentId)}/transactions`,
    body,
  );
}

/** Generates an idempotency key for one logical payment attempt. */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pmt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
