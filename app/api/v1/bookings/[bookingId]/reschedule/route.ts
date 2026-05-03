import { handleRescheduleBooking } from "@/features/bookings/handlers/booking.handlers";

export const runtime = "nodejs";

type BookingRouteContext = {
  params: Promise<{
    bookingId: string;
  }>;
};

/**
 * Routes booking reschedule requests to the current-user booking handler.
 */
export async function PATCH(request: Request, context: BookingRouteContext) {
  const { bookingId } = await context.params;

  return handleRescheduleBooking(request, bookingId);
}
