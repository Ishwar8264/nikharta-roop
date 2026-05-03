import { z } from "zod";

const idSchema = z.string().trim().cuid();

/**
 * Query schema for public review lists.
 */
export const listReviewsQuerySchema = z.object({
  branchId: idSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

/**
 * Request schema for POST /api/v1/bookings/:bookingId/review.
 */
export const createReviewSchema = z.object({
  commentHi: z.string().trim().max(1000).nullable().optional(),
  photoUrls: z
    .array(z.string().trim().url().max(2048))
    .max(6)
    .optional()
    .default([]),
  rating: z.coerce.number().int().min(1).max(5),
});

/**
 * Request schema for PATCH /api/v1/admin/reviews/:reviewId.
 */
export const updateReviewModerationSchema = z.object({
  isApproved: z.boolean(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ListReviewsQueryInput = z.infer<typeof listReviewsQuerySchema>;
export type UpdateReviewModerationInput = z.infer<
  typeof updateReviewModerationSchema
>;
