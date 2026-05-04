import { handleAdminCancelBooking } from "@/features/bookings/handlers/booking-admin-actions.handlers";

export const runtime = "nodejs";

type AdminBookingRouteContext = { params: Promise<{ bookingId: string }> };

export async function PATCH(request: Request, context: AdminBookingRouteContext) {
  const { bookingId } = await context.params;
  return handleAdminCancelBooking(request, bookingId);
}
