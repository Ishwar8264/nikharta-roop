import { z } from "zod";

import { resourceIdSchema } from "@/server/modules/salon/salon.schema";

const optionalUrlSchema = z
  .string({ error: "Image URL must be a string" })
  .trim()
  .url("Image URL is invalid")
  .max(2048, "Image URL is too long");

const ratingValueSchema = z
  .number({ error: "Rating must be a number" })
  .int("Rating must be an integer")
  .min(1, "Rating must be between 1 and 5")
  .max(5, "Rating must be between 1 and 5");

/**
 * Create/update body for a service or product review.
 *
 * Why:
 * `POST` is intentionally an upsert at the service layer — sending a new
 * review for an already-reviewed target overwrites the previous one so
 * clients do not have to remember whether they reviewed before.
 */
export const upsertReviewSchema = z.strictObject({
  rating: ratingValueSchema,
  comment: z
    .string({ error: "Comment must be a string" })
    .trim()
    .max(2000, "Comment must contain at most 2000 characters")
    .nullable()
    .optional(),
  images: z
    .array(optionalUrlSchema, { error: "Images must be an array of URLs" })
    .max(5, "At most 5 images are allowed")
    .default([]),
});

/** Edit body — all fields optional, at least one required. */
export const updateReviewSchema = upsertReviewSchema
  .partial()
  .extend({
    // Defaults belong to create/upsert only; PATCH must reject an empty body.
    images: upsertReviewSchema.shape.images.removeDefault().optional(),
  })
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    { message: "At least one field must be provided" },
  );

/** Query params for public review listings. */
export const listReviewsQuerySchema = z.strictObject({
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
  sort: z
    .enum(["recent", "rating_desc", "rating_asc"], {
      error: "Sort is invalid",
    })
    .default("recent"),
});

/**
 * Body for creating a staff rating via its appointment.
 *
 * Why:
 * The appointment carries the identity of both the customer and the staff
 * member, so the body only needs the rating content. This makes it
 * impossible for a client to rate a staff member they never visited.
 */
export const createStaffRatingSchema = z.strictObject({
  rating: ratingValueSchema,
  comment: z
    .string({ error: "Comment must be a string" })
    .trim()
    .max(2000, "Comment must contain at most 2000 characters")
    .nullable()
    .optional(),
});

/** Edit body for a staff rating. */
export const updateStaffRatingSchema = createStaffRatingSchema
  .partial()
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    { message: "At least one field must be provided" },
  );

/** URL params for service review routes. */
export const serviceReviewParamSchema = z.strictObject({
  serviceId: resourceIdSchema,
});

export const serviceReviewDetailParamSchema = z.strictObject({
  serviceId: resourceIdSchema,
  reviewId: resourceIdSchema,
});

/** URL params for product review routes. */
export const productReviewParamSchema = z.strictObject({
  productId: resourceIdSchema,
});

export const productReviewDetailParamSchema = z.strictObject({
  productId: resourceIdSchema,
  reviewId: resourceIdSchema,
});

/** URL params for staff rating routes. */
export const staffRatingParamSchema = z.strictObject({
  staffUserId: resourceIdSchema,
});

export const appointmentStaffRatingParamSchema = z.strictObject({
  appointmentId: resourceIdSchema,
});

export const staffRatingDetailParamSchema = z.strictObject({
  ratingId: resourceIdSchema,
});
