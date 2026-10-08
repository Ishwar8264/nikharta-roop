import type { z } from "zod";

import type { PaymentMethod, PaymentTxnType } from "@/generated/prisma/client";

import type {
  createPaymentTransactionSchema,
  listTransactionsQuerySchema,
} from "./payment.schema";

export type CreatePaymentTransactionInput = z.infer<
  typeof createPaymentTransactionSchema
>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;

/** Transaction row returned to clients. */
export interface PublicPaymentTransaction {
  id: string;
  appointmentId: string;
  type: PaymentTxnType;
  amount: number;
  commission: number;
  method: PaymentMethod;
  gatewayRef: string | null;
  createdAt: Date;
}

/** Cursor-paginated transaction list. */
export interface PaginatedPaymentTransactions {
  items: PublicPaymentTransaction[];
  nextCursor: string | null;
  hasMore: boolean;
}
