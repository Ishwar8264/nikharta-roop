import { z } from "zod";

/**
 * Validates CUID identifiers accepted by offer redemption endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema: z.ZodType<string | undefined, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

/**
 * Normalizes coupon codes before redemption lookup.
 */
const offerCodeSchema = z
  .string()
  .trim()
  .min(2)
  .max(20)
  .regex(/^[A-Z0-9_-]+$/i)
  .transform((value) => value.toUpperCase());

/**
 * Request schema for POST /api/v1/offers/redeem.
 */
export const redeemOfferSchema = z.object({
  bookingId: idSchema,
  code: offerCodeSchema,
});

/**
 * Query schema for current-user offer redemption history.
 */
export const listMyOfferRedemptionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * Query schema for admin offer redemption listing.
 */
export const listOfferRedemptionsQuerySchema = z.object({
  bookingId: optionalIdSchema,
  branchId: optionalIdSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offerId: optionalIdSchema,
  userId: optionalIdSchema,
});

export type ListMyOfferRedemptionsQueryInput = z.infer<
  typeof listMyOfferRedemptionsQuerySchema
>;
export type ListOfferRedemptionsQueryInput = z.infer<
  typeof listOfferRedemptionsQuerySchema
>;
export type RedeemOfferInput = z.infer<typeof redeemOfferSchema>;
