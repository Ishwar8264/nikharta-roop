import {
  handleGetRefund,
  handleUpdateRefund,
} from "@/features/refunds/handlers/refund.handlers";

export const runtime = "nodejs";

type AdminRefundRouteContext = {
  params: Promise<{ refundId: string }>;
};

/**
 * Routes admin refund detail requests to the refunds feature handler.
 */
export async function GET(request: Request, context: AdminRefundRouteContext) {
  const { refundId } = await context.params;
  return handleGetRefund(request, refundId);
}

/**
 * Routes admin refund patch requests to the refunds feature handler.
 */
export async function PATCH(request: Request, context: AdminRefundRouteContext) {
  const { refundId } = await context.params;
  return handleUpdateRefund(request, refundId);
}
