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

// ---------- Staff ratings ----------

/**
 * Browser-safe mirror of the server `PublicStaffRating`.
 *
 * Same rationale as `PublicReview` above: server modules carry `server-only`,
 * so the public shape is mirrored here to keep Client Components free of
 * `src/server/**` imports. `createdAt` is an ISO string over the wire.
 */
export interface PublicStaffRating {
  id: string;
  staffId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  appointmentId: string | null;
  customer: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

/**
 * A staff member the customer can rate for a completed appointment.
 *
 * The appointment's primary staff (`Appointment.staffId`) is the only member
 * the create endpoint will accept today; the per-service staff on
 * `AppointmentService` feeds the avatar/name shown next to the rating form.
 */
export interface RateableStaffMember {
  id: string;
  name: string | null;
  avatar: string | null;
}

/** Body for POST /appointments/{appointmentId}/staff-ratings. */
export interface CreateStaffRatingBody {
  rating: number;
  comment?: string | null;
}

/** Body for PATCH /staff-ratings/{ratingId}. */
export interface UpdateStaffRatingBody {
  rating?: number;
  comment?: string | null;
}

/** Response envelope for GET /appointments/{appointmentId}/staff-ratings. */
export interface StaffRatingListResponse {
  message: string;
  data: PublicStaffRating[];
}

/** Response envelope for POST/PATCH on a single staff rating. */
export interface StaffRatingMutationResponse {
  message: string;
  data: { rating: PublicStaffRating };
}
