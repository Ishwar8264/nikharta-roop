import { handleVerifyPayment } from "@/features/payments/handlers/payment.handlers";

export const runtime = "nodejs";

type PaymentRouteContext = {
  params: Promise<{
    paymentId: string;
  }>;
};

/**
 * Routes payment verification requests to the payment handler.
 */
export async function POST(request: Request, context: PaymentRouteContext) {
  const { paymentId } = await context.params;

  return handleVerifyPayment(request, paymentId);
}
