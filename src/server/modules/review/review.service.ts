import "server-only";

import {
  ReviewAccessDeniedError,
  ReviewAppointmentNotCompletedError,
  ReviewAppointmentNotFoundError,
  ReviewNoStaffToRateError,
  ReviewNotAppointmentCustomerError,
  ReviewNotFoundError,
  ReviewProductNotFoundError,
  ReviewServiceNotFoundError,
  ReviewStaffNotFoundError,
  ReviewStaffRatingExistsError,
} from "./review.errors";
import { toPublicReview, toPublicStaffRating } from "./review.mapper";
import {
  createStaffRating,
  deleteProductReview,
  deleteServiceReview,
  deleteStaffRating,
  findAppointmentForRating,
  findExistingStaffRating,
  findProductReviewById,
  findServiceReviewById,
  findStaffRatingById,
  listProductReviews,
  listServiceReviews,
  listStaffRatings,
  loadPublicProductReview,
  loadPublicServiceReview,
  loadPublicStaffRating,
  productExists,
  productRatingSummary,
  serviceExists,
  serviceRatingSummary,
  staffExists,
  staffRatingSummary,
  updateProductReview,
  updateServiceReview,
  updateStaffRating,
  upsertProductReview,
  upsertServiceReview,
} from "./review.repository";
import type {
  CreateStaffRatingInput,
  ListReviewsQuery,
  PaginatedReviews,
  PaginatedStaffRatings,
  PublicReview,
  PublicStaffRating,
  UpdateReviewInput,
  UpdateStaffRatingInput,
  UpsertReviewInput,
} from "./review.types";

// ---------- Service reviews ----------

/** Public list of reviews for a service. */
export async function listReviewsForService(
  serviceId: string,
  query: ListReviewsQuery,
): Promise<PaginatedReviews> {
  const exists = await serviceExists(serviceId);
  if (!exists) throw new ReviewServiceNotFoundError();

  const [result, summary] = await Promise.all([
    listServiceReviews(serviceId, query),
    serviceRatingSummary(serviceId),
  ]);

  return {
    items: result.items.map(toPublicReview),
    summary,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/**
 * Creates or replaces the caller's review for a service.
 *
 * Why:
 * `upsert` keeps the API idempotent from the client's view — a user who is
 * unsure whether they already reviewed simply posts again. Ownership is
 * enforced by the composite unique constraint.
 */
export async function createOrReplaceServiceReview(
  userId: string,
  serviceId: string,
  input: UpsertReviewInput,
): Promise<PublicReview> {
  const exists = await serviceExists(serviceId);
  if (!exists) throw new ReviewServiceNotFoundError();

  const review = await upsertServiceReview({
    serviceId,
    userId,
    rating: input.rating,
    comment: input.comment ?? null,
    images: input.images,
  });

  const loaded = await loadPublicServiceReview(review.id);
  if (!loaded) throw new ReviewNotFoundError();

  return toPublicReview(loaded);
}

/** Applies a partial update to the caller's own service review. */
export async function patchServiceReview(
  userId: string,
  serviceId: string,
  reviewId: string,
  input: UpdateReviewInput,
): Promise<PublicReview> {
  const review = await findServiceReviewById(serviceId, reviewId);
  if (!review) throw new ReviewNotFoundError();
  if (review.userId !== userId) throw new ReviewAccessDeniedError();

  const data: Record<string, unknown> = {};
  if (input.rating !== undefined) data.rating = input.rating;
  if (input.comment !== undefined) data.comment = input.comment;
  if (input.images !== undefined) data.images = input.images;

  await updateServiceReview(reviewId, data);

  const loaded = await loadPublicServiceReview(reviewId);
  if (!loaded) throw new ReviewNotFoundError();
  return toPublicReview(loaded);
}

/** Deletes the caller's own service review. */
export async function removeServiceReview(
  userId: string,
  serviceId: string,
  reviewId: string,
): Promise<void> {
  const review = await findServiceReviewById(serviceId, reviewId);
  if (!review) throw new ReviewNotFoundError();
  if (review.userId !== userId) throw new ReviewAccessDeniedError();

  await deleteServiceReview(reviewId);
}

// ---------- Product reviews ----------

export async function listReviewsForProduct(
  productId: string,
  query: ListReviewsQuery,
): Promise<PaginatedReviews> {
  const exists = await productExists(productId);
  if (!exists) throw new ReviewProductNotFoundError();

  const [result, summary] = await Promise.all([
    listProductReviews(productId, query),
    productRatingSummary(productId),
  ]);

  return {
    items: result.items.map(toPublicReview),
    summary,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

export async function createOrReplaceProductReview(
  userId: string,
  productId: string,
  input: UpsertReviewInput,
): Promise<PublicReview> {
  const exists = await productExists(productId);
  if (!exists) throw new ReviewProductNotFoundError();

  const review = await upsertProductReview({
    productId,
    userId,
    rating: input.rating,
    comment: input.comment ?? null,
    images: input.images,
  });

  const loaded = await loadPublicProductReview(review.id);
  if (!loaded) throw new ReviewNotFoundError();

  return toPublicReview(loaded);
}

export async function patchProductReview(
  userId: string,
  productId: string,
  reviewId: string,
  input: UpdateReviewInput,
): Promise<PublicReview> {
  const review = await findProductReviewById(productId, reviewId);
  if (!review) throw new ReviewNotFoundError();
  if (review.userId !== userId) throw new ReviewAccessDeniedError();

  const data: Record<string, unknown> = {};
  if (input.rating !== undefined) data.rating = input.rating;
  if (input.comment !== undefined) data.comment = input.comment;
  if (input.images !== undefined) data.images = input.images;

  await updateProductReview(reviewId, data);

  const loaded = await loadPublicProductReview(reviewId);
  if (!loaded) throw new ReviewNotFoundError();
  return toPublicReview(loaded);
}

export async function removeProductReview(
  userId: string,
  productId: string,
  reviewId: string,
): Promise<void> {
  const review = await findProductReviewById(productId, reviewId);
  if (!review) throw new ReviewNotFoundError();
  if (review.userId !== userId) throw new ReviewAccessDeniedError();

  await deleteProductReview(reviewId);
}

// ---------- Staff ratings ----------

/** Public list of ratings for a staff member. */
export async function listRatingsForStaff(
  staffUserId: string,
  query: ListReviewsQuery,
): Promise<PaginatedStaffRatings> {
  const exists = await staffExists(staffUserId);
  if (!exists) throw new ReviewStaffNotFoundError();

  const [result, summary] = await Promise.all([
    listStaffRatings(staffUserId, query),
    staffRatingSummary(staffUserId),
  ]);

  return {
    items: result.items.map(toPublicStaffRating),
    summary,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/**
 * Creates a staff rating for a completed appointment.
 *
 * Why:
 * The rating is bound to the appointment so a user can only rate a staff
 * member they actually visited. Three invariants must hold:
 *   1. The caller is the customer on the appointment.
 *   2. The appointment is COMPLETED.
 *   3. The appointment has an assigned staff member.
 * All three are checked before the insert so the DB unique constraint is
 * just a safety net for concurrent attempts.
 */
export async function createStaffRatingForAppointment(
  userId: string,
  appointmentId: string,
  input: CreateStaffRatingInput,
): Promise<PublicStaffRating> {
  const appointment = await findAppointmentForRating(appointmentId);
  if (!appointment) throw new ReviewAppointmentNotFoundError();

  if (appointment.customerId !== userId) {
    throw new ReviewNotAppointmentCustomerError();
  }

  if (appointment.status !== "COMPLETED") {
    throw new ReviewAppointmentNotCompletedError();
  }

  if (!appointment.staffId) {
    throw new ReviewNoStaffToRateError();
  }

  const existing = await findExistingStaffRating(
    appointmentId,
    appointment.staffId,
  );
  if (existing) throw new ReviewStaffRatingExistsError();

  let ratingId: string;
  try {
    ratingId = await createStaffRating({
      staffId: appointment.staffId,
      customerId: userId,
      appointmentId,
      rating: input.rating,
      comment: input.comment ?? null,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      throw new ReviewStaffRatingExistsError();
    }
    throw error;
  }

  const loaded = await loadPublicStaffRating(ratingId);
  if (!loaded) throw new ReviewNotFoundError();

  return toPublicStaffRating(loaded);
}

/** Applies a partial update to the caller's own staff rating. */
export async function patchStaffRating(
  userId: string,
  ratingId: string,
  input: UpdateStaffRatingInput,
): Promise<PublicStaffRating> {
  const rating = await findStaffRatingById(ratingId);
  if (!rating) throw new ReviewNotFoundError();
  if (rating.customerId !== userId) throw new ReviewAccessDeniedError();

  const data: Record<string, unknown> = {};
  if (input.rating !== undefined) data.rating = input.rating;
  if (input.comment !== undefined) data.comment = input.comment;

  await updateStaffRating(ratingId, data);

  const loaded = await loadPublicStaffRating(ratingId);
  if (!loaded) throw new ReviewNotFoundError();
  return toPublicStaffRating(loaded);
}

/** Deletes the caller's own staff rating. */
export async function removeStaffRating(
  userId: string,
  ratingId: string,
): Promise<void> {
  const rating = await findStaffRatingById(ratingId);
  if (!rating) throw new ReviewNotFoundError();
  if (rating.customerId !== userId) throw new ReviewAccessDeniedError();

  await deleteStaffRating(ratingId);
}
