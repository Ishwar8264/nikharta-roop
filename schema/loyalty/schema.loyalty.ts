import { LoyaltyTransactionType } from "@prisma/client";
import { z } from "zod";

/**
 * Validates CUID identifiers accepted by loyalty endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

/**
 * Validates current-user loyalty ledger query filters.
 */
export const listMyLoyaltyTransactionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  type: z.enum(LoyaltyTransactionType).optional(),
});

/**
 * Validates admin loyalty ledger query filters.
 */
export const listLoyaltyTransactionsQuerySchema = z.object({
  branchId: optionalIdSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
  type: z.enum(LoyaltyTransactionType).optional(),
  userId: optionalIdSchema,
});

/**
 * Validates admin-created loyalty ledger entries.
 */
export const createLoyaltyTransactionSchema = z.object({
  bookingId: optionalIdSchema,
  expiresAt: z.coerce.date().nullable().optional(),
  points: z.coerce.number().int().min(1).max(100000),
  reasonHi: z.string().trim().max(500).nullable().optional(),
  type: z.enum(LoyaltyTransactionType),
  userId: idSchema,
});

export type CreateLoyaltyTransactionInput = z.infer<
  typeof createLoyaltyTransactionSchema
>;
export type ListLoyaltyTransactionsQueryInput = z.infer<
  typeof listLoyaltyTransactionsQuerySchema
>;
export type ListMyLoyaltyTransactionsQueryInput = z.infer<
  typeof listMyLoyaltyTransactionsQuerySchema
>;
