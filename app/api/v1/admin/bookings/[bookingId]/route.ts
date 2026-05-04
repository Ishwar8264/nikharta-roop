import { handleAdminGetBooking } from "@/features/bookings/handlers/booking-admin.handlers";

export const runtime = "nodejs";

type AdminBookingRouteContext = { params: Promise<{ bookingId: string }> };

export async function GET(request: Request, context: AdminBookingRouteContext) {
  const { bookingId } = await context.params;
  return handleAdminGetBooking(request, bookingId);
}
