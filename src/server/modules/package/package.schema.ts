import { z } from "zod";

import { resourceIdSchema } from "@/server/modules/salon/salon.schema";

const slugSchema = z
  .string({ error: "Slug must be a string" })
  .trim()
  .min(2, "Slug must contain at least 2 characters")
  .max(80, "Slug must contain at most 80 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens",
  );

/** Creation body — serviceIds link existing salon services into the combo. */
export const createPackageSchema = z.strictObject({
  name: z
    .string({ error: "Name must be a string" })
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(120, "Name must contain at most 120 characters"),
  slug: slugSchema,
  price: z
    .number({ error: "Price must be a number" })
    .positive("Price must be greater than 0")
    .max(10_000_000, "Price is too large"),
  duration: z
    .number({ error: "Duration must be a number" })
    .int("Duration must be an integer")
    .min(5, "Duration must be at least 5 minutes")
    .max(1440, "Duration must be at most 1440 minutes"),
  isActive: z.boolean({ error: "Active flag must be a boolean" }).default(true),
  serviceIds: z
    .array(resourceIdSchema, { error: "serviceIds must be an array" })
    .max(30, "A package can contain at most 30 services")
    .optional(),
});

/**
 * Update body.
 *
 * Why:
 * The slug is immutable after creation (same reason coupon codes are) — it
 * shows up in public URLs and marketing. `serviceIds` replaces the whole
 * set when provided, which keeps PATCH semantics simple.
 */
export const updatePackageSchema = z
  .strictObject({
    name: z
      .string({ error: "Name must be a string" })
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .max(120, "Name must contain at most 120 characters")
      .optional(),
    price: z
      .number({ error: "Price must be a number" })
      .positive("Price must be greater than 0")
      .max(10_000_000, "Price is too large")
      .optional(),
    duration: z
      .number({ error: "Duration must be a number" })
      .int("Duration must be an integer")
      .min(5, "Duration must be at least 5 minutes")
      .max(1440, "Duration must be at most 1440 minutes")
      .optional(),
    isActive: z
      .boolean({ error: "Active flag must be a boolean" })
      .optional(),
    serviceIds: z
      .array(resourceIdSchema, { error: "serviceIds must be an array" })
      .max(30, "A package can contain at most 30 services")
      .optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

/** List query — mirrors the service/product listing pagination shape. */
export const listPackagesQuerySchema = z.strictObject({
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
  includeInactive: z
    .enum(["true", "false"], {
      error: "includeInactive must be 'true' or 'false'",
    })
    .transform((value) => value === "true")
    .optional(),
});

/** URL params for the nested package routes (ref = slug for public, id for management). */
export const packageParamSchema = z.strictObject({
  salonRef: z
    .string({ error: "Salon reference must be a string" })
    .trim()
    .min(2, "Salon reference must contain at least 2 characters")
    .max(80, "Salon reference must contain at most 80 characters"),
  packageRef: z
    .string({ error: "Package reference must be a string" })
    .trim()
    .min(2, "Package reference must contain at least 2 characters")
    .max(80, "Package reference must contain at most 80 characters"),
});
