import { api } from "@/lib/api/backend.client";

import type {
  ListReviewsQuery,
  PaginatedReviews,
  PublicReview,
  RatingSummary,
  ReviewListResponse,
  ReviewMutationResponse,
  ReviewSort,
  UpdateReviewBody,
  UpsertReviewBody,
} from "./types";

export type {
  ListReviewsQuery,
  PaginatedReviews,
  PublicReview,
  RatingSummary,
  ReviewListResponse,
  ReviewMutationResponse,
  ReviewSort,
  UpdateReviewBody,
  UpsertReviewBody,
};

/** Builds the `?cursor=&limit=&sort=` query string for a reviews list call. */
function buildListQuery(query: ListReviewsQuery = {}): string {
  const params = new URLSearchParams();
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.sort) params.set("sort", query.sort);
  const search = params.toString();
  return search ? `?${search}` : "";
}

/** Normalises the API response into the public paginated shape. */
function toPaginatedReviews(response: ReviewListResponse): PaginatedReviews {
  return {
    items: response.data,
    summary: response.meta?.summary ?? { average: 0, count: 0 },
    nextCursor: response.meta?.nextCursor ?? null,
    hasMore: response.meta?.hasMore ?? false,
  };
}

// ---------- Service reviews ----------

/** Lists public reviews for a service. */
export function listServiceReviewsApi(
  serviceId: string,
  query: ListReviewsQuery = {},
) {
  return api
    .get<ReviewListResponse>(
      `/services/${encodeURIComponent(serviceId)}/reviews${buildListQuery(query)}`,
    )
    .then(toPaginatedReviews);
}

/**
 * Creates or replaces the caller's review for a service.
 *
 * Why "createOrReplace" instead of plain "create":
 * The server uses a composite unique (serviceId, userId) and upserts — so a
 * user who is unsure whether they reviewed simply posts again. The client
 * does not need to remember a previous review's id.
 */
export function createOrReplaceServiceReviewApi(
  serviceId: string,
  body: UpsertReviewBody,
) {
  return api
    .post<ReviewMutationResponse>(
      `/services/${encodeURIComponent(serviceId)}/reviews`,
      body,
    )
    .then((response) => response.data.review);
}

/** Patches the caller's own service review. */
export function patchServiceReviewApi(
  serviceId: string,
  reviewId: string,
  body: UpdateReviewBody,
) {
  return api
    .patch<ReviewMutationResponse>(
      `/services/${encodeURIComponent(serviceId)}/reviews/${encodeURIComponent(reviewId)}`,
      body,
    )
    .then((response) => response.data.review);
}

/** Deletes the caller's own service review. */
export function deleteServiceReviewApi(serviceId: string, reviewId: string) {
  return api.delete<{ message: string; data: null }>(
    `/services/${encodeURIComponent(serviceId)}/reviews/${encodeURIComponent(reviewId)}`,
  );
}

// ---------- Product reviews ----------

/** Lists public reviews for a product. */
export function listProductReviewsApi(
  productId: string,
  query: ListReviewsQuery = {},
) {
  return api
    .get<ReviewListResponse>(
      `/products/${encodeURIComponent(productId)}/reviews${buildListQuery(query)}`,
    )
    .then(toPaginatedReviews);
}

/** Creates or replaces the caller's review for a product. */
export function createOrReplaceProductReviewApi(
  productId: string,
  body: UpsertReviewBody,
) {
  return api
    .post<ReviewMutationResponse>(
      `/products/${encodeURIComponent(productId)}/reviews`,
      body,
    )
    .then((response) => response.data.review);
}

/** Patches the caller's own product review. */
export function patchProductReviewApi(
  productId: string,
  reviewId: string,
  body: UpdateReviewBody,
) {
  return api
    .patch<ReviewMutationResponse>(
      `/products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}`,
      body,
    )
    .then((response) => response.data.review);
}

/** Deletes the caller's own product review. */
export function deleteProductReviewApi(productId: string, reviewId: string) {
  return api.delete<{ message: string; data: null }>(
    `/products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}`,
  );
}
