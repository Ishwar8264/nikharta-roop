import { getDb } from "@/db";
import {
  REVIEW_CODES,
  REVIEW_MESSAGES,
} from "@/features/reviews/constants/review.constants";
import { toPublicReview } from "@/features/reviews/helpers/review.mapper";
import { reviewSelect } from "@/features/reviews/helpers/review.selectors";
import { reviewJson } from "@/features/reviews/responses/review.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { updateReviewModerationSchema } from "@/schema/reviews/schema.review";
import {
  assertCanManageReviewBranch,
  handleReviewError,
  parseReviewBody,
  requireReviewAdmin,
  type ReviewAdminUser,
  ReviewVisibleError,
} from "./review.shared";

export async function handleUpdateReviewModeration(
  request: Request,
  reviewId: string,
) {
  const auth = await requireReviewAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseReviewBody(request, updateReviewModerationSchema);
  if (body.error) return body.error;
  return updateReviewModeration(
    reviewId,
    body.data.isApproved,
    auth.session.user,
  );
}

async function updateReviewModeration(
  reviewId: string,
  isApproved: boolean,
  admin: ReviewAdminUser,
) {
  try {
    const current = await getDb().review.findUnique({
      select: { booking: { select: { branchId: true } }, id: true },
      where: { id: reviewId },
    });
    if (!current) {
      throw new ReviewVisibleError(
        REVIEW_CODES.REVIEW_NOT_FOUND,
        REVIEW_MESSAGES.REVIEW_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }
    assertCanManageReviewBranch(admin, current.booking.branchId);
    const review = await getDb().review.update({
      data: { isApproved },
      select: reviewSelect(),
      where: { id: reviewId },
    });
    return reviewJson({
      code: REVIEW_CODES.REVIEW_UPDATED,
      data: { review: toPublicReview(review) },
      message: REVIEW_MESSAGES.REVIEW_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleReviewError(
      error,
      REVIEW_CODES.REVIEW_UPDATE_FAILED,
      REVIEW_MESSAGES.REVIEW_UPDATE_FAILED,
    );
  }
}
