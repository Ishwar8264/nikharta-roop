import {
  handleCreateBookingPayment,
  handleListBookingPayments,
} from "@/features/payments/handlers/payment.handlers";

export const runtime = "nodejs";

type BookingPaymentRouteContext = {
  params: Promise<{
    bookingId: string;
  }>;
};

/**
 * Routes booking payment list requests to the payment handler.
 */
export async function GET(
  request: Request,
  context: BookingPaymentRouteContext,
) {
  const { bookingId } = await context.params;

  return handleListBookingPayments(request, bookingId);
}

/**
 * Routes booking payment creation requests to the payment handler.
 */
export async function POST(
  request: Request,
  context: BookingPaymentRouteContext,
) {
  const { bookingId } = await context.params;

  return handleCreateBookingPayment(request, bookingId);
}
