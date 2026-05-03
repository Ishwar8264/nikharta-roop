import { handleCreateRefund } from "@/features/payments/handlers/payment.handlers";

export const runtime = "nodejs";

type PaymentRouteContext = {
  params: Promise<{
    paymentId: string;
  }>;
};

/**
 * Routes refund request creation to the payment handler.
 */
export async function POST(request: Request, context: PaymentRouteContext) {
  const { paymentId } = await context.params;

  return handleCreateRefund(request, paymentId);
}
