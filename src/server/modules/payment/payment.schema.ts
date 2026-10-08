import { z } from "zod";

import { resourceIdSchema } from "@/server/modules/salon/salon.schema";

/**
 * Creation body for a payment transaction.
 *
 * Why:
 * The idempotency key is caller-supplied and required — retried payment
 * requests carry the same key, so the database unique constraint turns a
 * double-submit into a conflict instead of a double charge.
 */
export const createPaymentTransactionSchema = z.strictObject({
  type: z.enum(["ADVANCE", "FINAL", "REFUND"], {
    error: "Type must be ADVANCE, FINAL, or REFUND",
  }),
  amount: z
    .number({ error: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .max(10_000_000, "Amount is too large"),
  method: z.enum(["CASH", "CARD", "UPI", "WALLET", "ONLINE"], {
    error: "Method is invalid",
  }),
  commission: z
    .number({ error: "Commission must be a number" })
    .nonnegative("Commission cannot be negative")
    .max(10_000_000, "Commission is too large")
    .default(0),
  gatewayRef: z
    .string({ error: "Gateway reference must be a string" })
    .trim()
    .max(128, "Gateway reference is too long")
    .optional(),
  idempotencyKey: z
    .string({ error: "Idempotency key must be a string" })
    .trim()
    .min(8, "Idempotency key must contain at least 8 characters")
    .max(128, "Idempotency key must contain at most 128 characters"),
}).refine(
  (input) => input.commission <= input.amount,
  { message: "Commission cannot exceed the transaction amount", path: ["commission"] },
);

/** List query — mirrors the module pagination convention. */
export const listTransactionsQuerySchema = z.strictObject({
  cursor: z
    .string({ error: "Cursor must be a string" })
    .pipe(resourceIdSchema)
    .optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be at most 100")
    .default(20),
});
