/**
 * Browser-safe mirror of `src/server/modules/review/review.types.ts`.
 *
 * Why a copy and not an import:
 * Server modules may be marked `server-only`. Mirroring the public shape here
 * keeps Client Components free of `src/server/**` imports while still giving
 * the review UI a single typed contract with the API.
 *
 * Dates serialise to ISO strings over JSON, so `createdAt` is typed as a
 * string here (vs `Date` on the server) — `Intl.DateTimeFormat` accepts both
 * transparently.
 */
export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  images: string[];
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

export interface RatingSummary {
  average: number;
  count: number;
}

export interface PaginatedReviews {
  items: PublicReview[];
  summary: RatingSummary;
  nextCursor: string | null;
  hasMore: boolean;
}

/** Sort options accepted by the GET /reviews endpoints. */
export type ReviewSort = "recent" | "rating_desc" | "rating_asc";

/** Query params for the GET /reviews endpoints. */
export interface ListReviewsQuery {
  cursor?: string;
  limit?: number;
  sort?: ReviewSort;
}

/** Body for POST /services/{id}/reviews and POST /products/{id}/reviews. */
export interface UpsertReviewBody {
  rating: number;
  comment?: string | null;
  images?: string[];
}

/** Body for PATCH /services/{id}/reviews/{rid} and PATCH /products/{id}/reviews/{rid}. */
export interface UpdateReviewBody {
  rating?: number;
  comment?: string | null;
  images?: string[];
}

/** API response envelopes. */
export interface ReviewListResponse {
  message: string;
  data: PublicReview[];
  meta: {
    summary: RatingSummary;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface ReviewMutationResponse {
  message: string;
  data: { review: PublicReview };
}
