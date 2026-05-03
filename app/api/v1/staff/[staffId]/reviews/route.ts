import { handleListStaffReviews } from "@/features/reviews/handlers/review-list.handlers";

export const runtime = "nodejs";

type ReviewRouteContext = { params: Promise<{ staffId: string }> };

export async function GET(request: Request, context: ReviewRouteContext) {
  const { staffId } = await context.params;
  return handleListStaffReviews(request, staffId);
}
