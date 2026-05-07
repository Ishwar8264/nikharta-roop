import { handleGetAdminPayment } from "@/features/admin-payments/handlers/admin-payment.handlers";

export const runtime = "nodejs";

type AdminPaymentRouteContext = {
  params: Promise<{ paymentId: string }>;
};

/**
 * Routes admin payment detail requests to feature handlers.
 */
export async function GET(request: Request, context: AdminPaymentRouteContext) {
  const { paymentId } = await context.params;
  return handleGetAdminPayment(request, paymentId);
}
