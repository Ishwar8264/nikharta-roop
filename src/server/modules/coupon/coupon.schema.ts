import { z } from "zod";

import { resourceIdSchema } from "@/server/modules/salon/salon.schema";

const isoDateTime = z
  .string({ error: "Time must be a string" })
  .pipe(z.iso.datetime({ offset: true }));

const discountTypeSchema = z.enum(["PERCENTAGE", "FLAT"], {
  error: "Discount type must be PERCENTAGE or FLAT",
});

/**
 * Coupon codes are normalized to uppercase on write.
 *
 * Why:
 * Users type codes in every case; storing one canonical form means a single
 * `@unique` constraint catches collisions and lookups never branch on case.
 * Length is capped well below the DB column size to leave headroom.
 */
const couponCodeSchema = z
  .string({ error: "Code must be a string" })
  .trim()
  .min(3, "Code must contain at least 3 characters")
  .max(32, "Code must contain at most 32 characters")
  .regex(/^[A-Z0-9-]+$/i, "Code may contain only letters, digits, and hyphens")
  .transform((value) => value.toUpperCase());

/**
 * Creation body.
 *
 * Why:
 * `usedCount` is never accepted from the caller — it is derived from actual
 * appointment usage. The refinements below enforce the coupling between
 * discountType and its value, so a PERCENTAGE cannot have a value above 100
 * and a FLAT discount cannot exceed a sane rupee cap.
 */
export const createCouponSchema = z
  .strictObject({
    code: couponCodeSchema,
    description: z
      .string({ error: "Description must be a string" })
      .trim()
      .max(500, "Description must contain at most 500 characters")
      .optional(),
    discountType: discountTypeSchema,
    discountValue: z
      .number({ error: "Discount value must be a number" })
      .positive("Discount value must be greater than 0")
      .max(1_000_000, "Discount value is too large"),
    minOrderAmount: z
      .number({ error: "Minimum order amount must be a number" })
      .nonnegative("Minimum order amount cannot be negative")
      .max(10_000_000, "Minimum order amount is too large")
      .optional(),
    maxDiscount: z
      .number({ error: "Maximum discount must be a number" })
      .positive("Maximum discount must be greater than 0")
      .max(10_000_000, "Maximum discount is too large")
      .optional(),
    usageLimit: z
      .number({ error: "Usage limit must be a number" })
      .int("Usage limit must be an integer")
      .positive("Usage limit must be greater than 0")
      .max(10_000_000, "Usage limit is too large")
      .optional(),
    perUserLimit: z
      .number({ error: "Per-user limit must be a number" })
      .int("Per-user limit must be an integer")
      .positive("Per-user limit must be greater than 0")
      .max(1000, "Per-user limit is too large")
      .default(1),
    validFrom: isoDateTime,
    validUntil: isoDateTime,
    isActive: z
      .boolean({ error: "Active flag must be a boolean" })
      .default(true),
  })
  .refine((input) => new Date(input.validFrom) < new Date(input.validUntil), {
    message: "validUntil must be after validFrom",
    path: ["validUntil"],
  })
  .refine(
    (input) =>
      input.discountType !== "PERCENTAGE" ||
      (input.discountValue > 0 && input.discountValue <= 100),
    {
      message: "Percentage discount must be between 0 and 100",
      path: ["discountValue"],
    },
  )
  .refine(
    (input) =>
      input.discountType !== "FLAT" ||
      input.maxDiscount === undefined ||
      input.maxDiscount >= input.discountValue,
    {
      message: "Maximum discount cannot be less than the flat discount value",
      path: ["maxDiscount"],
    },
  );

/**
 * Update body.
 *
 * Why:
 * The code is immutable after creation — changing a code would silently
 * break bookmarks and marketing materials. All other fields are optional so
 * PATCH semantics hold. The service applies the same discount validations
 * against the merged (existing + patch) state.
 */
export const updateCouponSchema = z
  .strictObject({
    description: z
      .string({ error: "Description must be a string" })
      .trim()
      .max(500, "Description must contain at most 500 characters")
      .nullable()
      .optional(),
    discountType: discountTypeSchema.optional(),
    discountValue: z
      .number({ error: "Discount value must be a number" })
      .positive("Discount value must be greater than 0")
      .max(1_000_000, "Discount value is too large")
      .optional(),
    minOrderAmount: z
      .number({ error: "Minimum order amount must be a number" })
      .nonnegative("Minimum order amount cannot be negative")
      .max(10_000_000, "Minimum order amount is too large")
      .nullable()
      .optional(),
    maxDiscount: z
      .number({ error: "Maximum discount must be a number" })
      .positive("Maximum discount must be greater than 0")
      .max(10_000_000, "Maximum discount is too large")
      .nullable()
      .optional(),
    usageLimit: z
      .number({ error: "Usage limit must be a number" })
      .int("Usage limit must be an integer")
      .positive("Usage limit must be greater than 0")
      .max(10_000_000, "Usage limit is too large")
      .nullable()
      .optional(),
    perUserLimit: z
      .number({ error: "Per-user limit must be a number" })
      .int("Per-user limit must be an integer")
      .positive("Per-user limit must be greater than 0")
      .max(1000, "Per-user limit is too large")
      .optional(),
    validFrom: isoDateTime.optional(),
    validUntil: isoDateTime.optional(),
    isActive: z.boolean({ error: "Active flag must be a boolean" }).optional(),
  })
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    { message: "At least one field must be provided" },
  );

/** Admin list query. */
export const listCouponsQuerySchema = z.strictObject({
  cursor: z
    .string({ error: "Cursor must be a string" })
    .pipe(resourceIdSchema)
    .optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be at most 100")
    .default(50),
  search: z
    .string({ error: "Search must be a string" })
    .trim()
    .min(2, "Search must contain at least 2 characters")
    .max(32, "Search must contain at most 32 characters")
    .optional(),
  isActive: z
    .enum(["true", "false"], { error: "isActive must be 'true' or 'false'" })
    .transform((value) => value === "true")
    .optional(),
});

/**
 * Public validate body.
 *
 * Why:
 * `subtotal` is required so the response can show the actual rupee discount
 * the coupon would apply — not just a yes/no. The client can then display
 * "₹150 off" with confidence before the user commits to booking.
 */
export const validateCouponSchema = z.strictObject({
  code: couponCodeSchema,
  subtotal: z
    .number({ error: "Subtotal must be a number" })
    .nonnegative("Subtotal cannot be negative")
    .max(10_000_000, "Subtotal is too large"),
});

/** URL params for the coupon code lookup (public). */
export const couponCodeParamSchema = z.strictObject({
  code: couponCodeSchema,
});

/** URL params for the coupon id routes (admin). */
export const couponIdParamSchema = z.strictObject({
  couponId: resourceIdSchema,
});
