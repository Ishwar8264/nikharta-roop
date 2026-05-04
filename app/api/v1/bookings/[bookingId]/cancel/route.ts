import { handleCancelBooking } from "@/features/bookings/handlers/booking.handlers";

export const runtime = "nodejs";

type BookingRouteContext = {
  params: Promise<{
    bookingId: string;
  }>;
};

/**
 * Routes booking cancellation requests to the current-user booking handler.
 */
export async function PATCH(request: Request, context: BookingRouteContext) {
  const { bookingId } = await context.params;

  return handleCancelBooking(request, bookingId);
}
