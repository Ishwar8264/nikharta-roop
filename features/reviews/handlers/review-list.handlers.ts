import { getDb } from "@/db";
import {
  REVIEW_CODES,
  REVIEW_MESSAGES,
} from "@/features/reviews/constants/review.constants";
import { toPublicReview } from "@/features/reviews/helpers/review.mapper";
import { reviewSelect } from "@/features/reviews/helpers/review.selectors";
import { reviewJson } from "@/features/reviews/responses/review.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { listReviewsQuerySchema } from "@/schema/reviews/schema.review";
import { handleReviewError } from "./review.shared";

export async function handleListServiceReviews(
  request: Request,
  serviceId: string,
) {
  return listReviews(request, { serviceId });
}

export async function handleListStaffReviews(request: Request, staffId: string) {
  return listReviews(request, { staffId });
}

async function listReviews(
  request: Request,
  scope: { serviceId?: string; staffId?: string },
) {
  const parsed = listReviewsQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return handleReviewError(
      parsed.error,
      REVIEW_CODES.VALIDATION_ERROR,
      REVIEW_MESSAGES.VALIDATION_ERROR,
    );
  }

  try {
    const reviews = await getDb().review.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: reviewSelect(),
      take: parsed.data.limit,
      where: {
        booking: { branchId: parsed.data.branchId },
        isApproved: true,
        serviceId: scope.serviceId,
        staffId: scope.staffId,
      },
    });
    return reviewJson({
      code: REVIEW_CODES.REVIEW_LISTED,
      data: { limit: parsed.data.limit, reviews: reviews.map(toPublicReview) },
      message: REVIEW_MESSAGES.REVIEW_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleReviewError(
      error,
      REVIEW_CODES.REVIEW_LIST_LOAD_FAILED,
      REVIEW_MESSAGES.REVIEW_LIST_LOAD_FAILED,
    );
  }
}
