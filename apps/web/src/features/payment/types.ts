import type { PaymentTransaction } from "./api";

/**
 * Re-export the wire types so feature code can depend on `./types` without
 * pulling in the API client (which is client-only). Mirrors the
 * `features/appointment/types.ts` pattern.
 */
export type {
  PaymentMethod,
  PaymentTransaction,
  PaymentTxnType,
} from "./api";

/** Props for the appointment-detail payment ledger. */
export interface PaymentLedgerProps {
  appointmentId: string;
  totalPrice: number;
  transactions: PaymentTransaction[];
  /**
   * True when the viewer may record a new transaction (salon owner/manager or
   * the customer). The customer-facing appointment detail page sets this to
   * false; the salon-side manage screen (later phase) will set it to true.
   */
  canRecord: boolean;
}
