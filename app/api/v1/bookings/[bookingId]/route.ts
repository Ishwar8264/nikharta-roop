import { handleGetBooking } from "@/features/bookings/handlers/booking.handlers";

export const runtime = "nodejs";

type BookingRouteContext = {
  params: Promise<{
    bookingId: string;
  }>;
};

/**
 * Routes booking detail requests to the current-user booking handler.
 */
export async function GET(request: Request, context: BookingRouteContext) {
  const { bookingId } = await context.params;

  return handleGetBooking(request, bookingId);
}
