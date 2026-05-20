/**
 * Purpose: Offer API validation schemas and inferred request types.
 * Responsibilities: normalize public/admin offer queries, coupon validation payloads, and admin writes.
 * Important notes: coupon codes are normalized to uppercase before handlers touch business logic.
 */
import { DiscountType } from "@prisma/client";
import { z } from "zod";

/**
 * Validates CUID identifiers accepted by offer endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema: z.ZodType<string | undefined, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

/**
 * Validates positive money amounts used by offer discounts and orders.
 */
const moneySchema = z.coerce.number().min(0).max(999999.99);

/**
 * Normalizes public coupon codes before DB lookup.
 */
const offerCodeSchema = z
  .string()
  .trim()
  .min(2)
  .max(20)
  .regex(/^[A-Z0-9_-]+$/i)
  .transform((value) => value.toUpperCase());

/**
 * Query schema for GET /api/v1/offers.
 */
export const listOffersQuerySchema = z.object({
  branchId: optionalIdSchema,
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * Query schema for GET /api/v1/admin/offers.
 */
export const listAdminOffersQuerySchema = z.object({
  branchId: optionalIdSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(["active", "inactive", "all"]).default("all"),
});

/**
 * Request schema for POST /api/v1/offers/validate.
 */
export const validateOfferSchema = z.object({
  branchId: idSchema,
  code: offerCodeSchema,
  orderAmount: moneySchema,
  serviceIds: z.array(idSchema).max(30).optional().default([]),
});

/**
 * Shared admin offer payload fields.
 */
const offerBodySchema = z.object({
  branchId: optionalIdSchema,
  code: offerCodeSchema,
  descriptionHi: z.string().trim().max(2000).nullable().optional(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: moneySchema,
  isActive: z.boolean().optional(),
  maxDiscount: moneySchema.nullable().optional(),
  minOrder: moneySchema.nullable().optional(),
  perUserLimit: z.coerce.number().int().min(1).max(1000).nullable().optional(),
  serviceIds: z.array(idSchema).max(100).optional().default([]),
  titleEn: z.string().trim().max(200).nullable().optional(),
  titleHi: z.string().trim().min(2).max(200),
  usageLimit: z.coerce.number().int().min(1).max(1000000).nullable().optional(),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
});

/**
 * Request schema for POST /api/v1/admin/offers.
 */
export const createOfferSchema = offerBodySchema.refine(
  (value) => value.validFrom < value.validUntil,
  {
    message: "Offer start date must be before end date.",
    path: ["validUntil"],
  },
);

/**
 * Request schema for PATCH /api/v1/admin/offers/:offerId.
 */
export const updateOfferSchema = offerBodySchema
  .omit({ serviceIds: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one offer field to update.",
  })
  .refine(
    (value) =>
      !value.validFrom || !value.validUntil || value.validFrom < value.validUntil,
    {
      message: "Offer start date must be before end date.",
      path: ["validUntil"],
    }
  );

/**
 * Request schema for POST /api/v1/admin/offers/:offerId/services.
 */
export const assignOfferServiceSchema = z.object({
  serviceId: idSchema,
});

export type AssignOfferServiceInput = z.infer<typeof assignOfferServiceSchema>;
export type CreateOfferInput = Omit<
  z.infer<typeof createOfferSchema>,
  "serviceIds"
> & {
  serviceIds: string[];
};
export type ListAdminOffersQueryInput = z.infer<typeof listAdminOffersQuerySchema>;
export type ListOffersQueryInput = Omit<
  z.infer<typeof listOffersQuerySchema>,
  "limit"
> & {
  limit: number;
};
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
export type ValidateOfferInput = z.infer<typeof validateOfferSchema>;
