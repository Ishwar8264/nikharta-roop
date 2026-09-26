import { z } from "zod";

import { resourceIdSchema } from "@/server/modules/salon/salon.schema";

/** Transaction ledger listing query. */
export const listTransactionsQuerySchema = z.strictObject({
  cursor: z
    .string({ error: "Cursor must be a string" })
    .pipe(resourceIdSchema)
    .optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit must be at most 50")
    .default(20),
  type: z
    .enum(["EARNED", "REDEEMED", "EXPIRED", "REFUNDED"], {
      error: "Type is invalid",
    })
    .optional(),
});

/**
 * Redemption body.
 *
 * Why:
 * The client requests a specific number of points to redeem; the server
 * converts it to a monetary discount using the redemption rate and returns
 * both. Amount is a positive integer so a fractional request cannot bypass
 * the integer ledger.
 */
export const redeemPointsSchema = z.strictObject({
  points: z
    .number({ error: "Points must be a number" })
    .int("Points must be an integer")
    .min(1, "Points must be at least 1")
    .max(1_000_000, "Points is too large"),
  appointmentId: resourceIdSchema.optional(),
  description: z
    .string({ error: "Description must be a string" })
    .trim()
    .max(500, "Description must contain at most 500 characters")
    .optional(),
});

/** URL params for the transaction detail route. */
export const transactionParamSchema = z.strictObject({
  txnId: resourceIdSchema,
});
