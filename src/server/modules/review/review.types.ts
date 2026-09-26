import type { z } from "zod";

import type {
  createStaffRatingSchema,
  listReviewsQuerySchema,
  updateReviewSchema,
  updateStaffRatingSchema,
  upsertReviewSchema,
} from "./review.schema";

export type UpsertReviewInput = z.infer<typeof upsertReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
export type CreateStaffRatingInput = z.infer<typeof createStaffRatingSchema>;
export type UpdateStaffRatingInput = z.infer<typeof updateStaffRatingSchema>;

/** Public shape of a service or product review. */
export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  images: string[];
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

/** Public shape of a staff rating. */
export interface PublicStaffRating {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  appointmentId: string | null;
  customer: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

/** Rating summary for a target (service, product, or staff). */
export interface RatingSummary {
  average: number;
  count: number;
}

/** Paginated response for reviews. */
export interface PaginatedReviews {
  items: PublicReview[];
  summary: RatingSummary;
  nextCursor: string | null;
  hasMore: boolean;
}

/** Paginated response for staff ratings. */
export interface PaginatedStaffRatings {
  items: PublicStaffRating[];
  summary: RatingSummary;
  nextCursor: string | null;
  hasMore: boolean;
}
