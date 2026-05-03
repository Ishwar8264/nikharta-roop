import { handleUpdateReviewModeration } from "@/features/reviews/handlers/review-admin.handlers";

export const runtime = "nodejs";

type ReviewRouteContext = { params: Promise<{ reviewId: string }> };

export async function PATCH(request: Request, context: ReviewRouteContext) {
  const { reviewId } = await context.params;
  return handleUpdateReviewModeration(request, reviewId);
}
