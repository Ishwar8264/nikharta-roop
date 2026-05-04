import { handleListServiceReviews } from "@/features/reviews/handlers/review-list.handlers";

export const runtime = "nodejs";

type ReviewRouteContext = { params: Promise<{ serviceId: string }> };

export async function GET(request: Request, context: ReviewRouteContext) {
  const { serviceId } = await context.params;
  return handleListServiceReviews(request, serviceId);
}
