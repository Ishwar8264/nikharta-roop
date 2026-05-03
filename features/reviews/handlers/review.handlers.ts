import { BookingStatus } from "@prisma/client";

import { getDb } from "@/db";
import {
  REVIEW_CODES,
  REVIEW_MESSAGES,
} from "@/features/reviews/constants/review.constants";
import { toPublicReview } from "@/features/reviews/helpers/review.mapper";
import { reviewSelect } from "@/features/reviews/helpers/review.selectors";
import { reviewJson } from "@/features/reviews/responses/review.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  createReviewSchema,
  type CreateReviewInput,
} from "@/schema/reviews/schema.review";
import {
  handleReviewError,
  parseReviewBody,
  requireReviewAuth,
  ReviewVisibleError,
} from "./review.shared";

export async function handleCreateBookingReview(
  request: Request,
  bookingId: string,
) {
  const auth = await requireReviewAuth(request);
  if (!auth.success) return auth.error;
  const body = await parseReviewBody(request, createReviewSchema);
  if (body.error) return body.error;
  return createBookingReview(bookingId, auth.session.userId, body.data);
}

async function createBookingReview(
  bookingId: string,
  userId: string,
  input: CreateReviewInput,
) {
  try {
    const booking = await getDb().booking.findFirst({
      select: { id: true, serviceId: true, staffId: true, status: true },
      where: { id: bookingId, userId },
    });
    if (!booking || booking.status !== BookingStatus.COMPLETED) {
      throw new ReviewVisibleError(
        REVIEW_CODES.BOOKING_NOT_FOUND,
        REVIEW_MESSAGES.BOOKING_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }
    const review = await getDb().review.create({
      data: {
        bookingId,
        commentHi: input.commentHi ?? null,
        photoUrls: input.photoUrls,
        rating: input.rating,
        serviceId: booking.serviceId,
        staffId: booking.staffId,
        userId,
      },
      select: reviewSelect(),
    });
    return reviewJson({
      code: REVIEW_CODES.REVIEW_CREATED,
      data: { review: toPublicReview(review) },
      message: REVIEW_MESSAGES.REVIEW_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    if (isUniqueError(error)) {
      return handleReviewError(
        new ReviewVisibleError(
          REVIEW_CODES.REVIEW_DUPLICATE,
          REVIEW_MESSAGES.REVIEW_DUPLICATE,
          HTTP_STATUS.CONFLICT,
        ),
        REVIEW_CODES.REVIEW_CREATE_FAILED,
        REVIEW_MESSAGES.REVIEW_CREATE_FAILED,
      );
    }
    return handleReviewError(
      error,
      REVIEW_CODES.REVIEW_CREATE_FAILED,
      REVIEW_MESSAGES.REVIEW_CREATE_FAILED,
    );
  }
}

function isUniqueError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
