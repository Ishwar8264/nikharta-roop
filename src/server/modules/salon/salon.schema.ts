import { z } from "zod";

const slugSchema = z
  .string({ error: "Slug must be a string" })
  .trim()
  .min(2, "Slug must contain at least 2 characters")
  .max(80, "Slug must contain at most 80 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens",
  );

const optionalUrlSchema = z
  .string({ error: "URL must be a string" })
  .trim()
  .url("URL is invalid")
  .max(2048, "URL is too long");

export const resourceIdSchema = z
  .string({ error: "Resource ID must be a string" })
  .regex(
    /^(?:[a-f0-9]{48}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
    "Resource ID must be a valid identifier",
  );

/**
 * Public list query — paginated with filters.
 *
 * Why:
 * Cursor pagination (`cursor` + `limit`) is stable under inserts. Offset
 * pagination re-orders rows when new items are created, which is exactly the
 * bug that makes infinite scroll skip entries on a busy marketplace.
 */
export const listSalonsQuerySchema = z.strictObject({
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
  city: z
    .string({ error: "City must be a string" })
    .trim()
    .min(1, "City must not be empty")
    .max(80, "City must contain at most 80 characters")
    .optional(),
  category: z
    .enum(["MALE", "FEMALE", "UNISEX", "KIDS"], {
      error: "Category is invalid",
    })
    .optional(),
  search: z
    .string({ error: "Search must be a string" })
    .trim()
    .min(2, "Search must contain at least 2 characters")
    .max(80, "Search must contain at most 80 characters")
    .optional(),
});

/**
 * Salon creation body.
 *
 * Why:
 * Slug is optional — when omitted, it is derived from `name` with collision
 * handling. When supplied, it must already be URL-safe so we do not silently
 * mangle a user's branding choice.
 */
export const createSalonSchema = z.strictObject({
  name: z
    .string({ error: "Name must be a string" })
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(120, "Name must contain at most 120 characters"),
  slug: slugSchema.optional(),
  description: z
    .string({ error: "Description must be a string" })
    .trim()
    .max(2000, "Description must contain at most 2000 characters")
    .optional(),
  category: z
    .enum(["MALE", "FEMALE", "UNISEX", "KIDS"], {
      error: "Category is invalid",
    })
    .default("UNISEX"),
  address: z
    .string({ error: "Address must be a string" })
    .trim()
    .min(5, "Address must contain at least 5 characters")
    .max(500, "Address must contain at most 500 characters"),
  city: z
    .string({ error: "City must be a string" })
    .trim()
    .min(1, "City must not be empty")
    .max(80, "City must contain at most 80 characters"),
  state: z
    .string({ error: "State must be a string" })
    .trim()
    .min(1, "State must not be empty")
    .max(80, "State must contain at most 80 characters"),
  zip: z
    .string({ error: "ZIP must be a string" })
    .trim()
    .min(3, "ZIP must contain at least 3 characters")
    .max(12, "ZIP must contain at most 12 characters"),
  country: z
    .string({ error: "Country must be a string" })
    .trim()
    .length(2, "Country must be an ISO 3166-1 alpha-2 code")
    .toUpperCase()
    .default("IN"),
  timezone: z
    .string({ error: "Timezone must be a string" })
    .trim()
    .min(1, "Timezone must not be empty")
    .max(64, "Timezone must contain at most 64 characters")
    .default("Asia/Kolkata"),
  lat: z
    .number({ error: "Latitude must be a number" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  lng: z
    .number({ error: "Longitude must be a number" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  placeId: z
    .string({ error: "Place ID must be a string" })
    .trim()
    .max(255, "Place ID is too long")
    .optional(),
  phone: z
    .string({ error: "Phone must be a string" })
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, "Phone must use E.164 format")
    .optional(),
  email: z
    .string({ error: "Email must be a string" })
    .trim()
    .max(254, "Email must contain at most 254 characters")
    .pipe(z.email({ error: "Email format is invalid" }))
    .transform((email) => email.toLowerCase())
    .optional(),
  images: z
    .array(optionalUrlSchema, { error: "Images must be an array of URLs" })
    .max(20, "At most 20 images are allowed")
    .default([]),
  seoTitle: z
    .string({ error: "SEO title must be a string" })
    .trim()
    .max(70, "SEO title must contain at most 70 characters")
    .optional(),
  seoDescription: z
    .string({ error: "SEO description must be a string" })
    .trim()
    .max(160, "SEO description must contain at most 160 characters")
    .optional(),
});

/**
 * Partial update body — every field optional, at least one required.
 *
 * Why:
 * PATCH semantics. The refine blocks empty bodies so a client sending `{}`
 * gets a clear 400 instead of a silent no-op that reports 200.
 */
export const updateSalonSchema = createSalonSchema
  .partial()
  .extend({
    // Defaults belong to creation only. PATCH must preserve omitted fields.
    category: createSalonSchema.shape.category.removeDefault().optional(),
    country: createSalonSchema.shape.country.removeDefault().optional(),
    timezone: createSalonSchema.shape.timezone.removeDefault().optional(),
    images: createSalonSchema.shape.images.removeDefault().optional(),
    description: createSalonSchema.shape.description.nullable(),
    placeId: createSalonSchema.shape.placeId.nullable(),
    phone: createSalonSchema.shape.phone.nullable(),
    email: createSalonSchema.shape.email.nullable(),
    seoTitle: createSalonSchema.shape.seoTitle.nullable(),
    seoDescription: createSalonSchema.shape.seoDescription.nullable(),
  })
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    { message: "At least one field must be provided" },
  );

/** Body for adding a member to a salon. */
export const addSalonMemberSchema = z.strictObject({
  userId: resourceIdSchema,
  role: z.enum(["OWNER", "MANAGER", "STAFF"], {
    error: "Role is invalid",
  }),
});

/**
 * URL params for routes keyed by either a slug or a resource id.
 *
 * Why:
 * Next.js forbids two different dynamic segment names at the same path level
 * (`[slug]` and `[id]`), so both shapes share a single `[salonRef]` segment.
 * Routes narrow the value themselves with `isResourceId`.
 */
export const salonRefParamSchema = z.strictObject({
  salonRef: z
    .string({ error: "Salon reference must be a string" })
    .trim()
    .min(2, "Salon reference must contain at least 2 characters")
    .max(80, "Salon reference must contain at most 80 characters"),
});

/** URL params for the member removal route. */
export const salonMemberParamSchema = z.strictObject({
  salonRef: z
    .string({ error: "Salon reference must be a string" })
    .trim()
    .min(2, "Salon reference must contain at least 2 characters")
    .max(80, "Salon reference must contain at most 80 characters"),
  memberId: resourceIdSchema,
});
