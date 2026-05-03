import { handleCreateBookingReview } from "@/features/reviews/handlers/review.handlers";

export const runtime = "nodejs";

type ReviewRouteContext = { params: Promise<{ bookingId: string }> };

export async function POST(request: Request, context: ReviewRouteContext) {
  const { bookingId } = await context.params;
  return handleCreateBookingReview(request, bookingId);
}
