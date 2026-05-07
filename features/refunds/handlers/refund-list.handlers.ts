import { getDb } from "@/db";
import { REFUND_CODES, REFUND_MESSAGES } from "@/features/refunds/constants/refund.constants";
import { refundSelect } from "@/features/refunds/helpers/refund.selectors";
import {
  listRefundsQuerySchema,
  type ListRefundsQueryInput,
} from "@/schema/refunds/schema.refund";
import { handleRefundError, throwRefundNotFound } from "./refund.errors";
import { resolveRefundBranch } from "./refund.guards";
import { parseRefundQuery, refundDetailResponse, refundListResponse } from "./refund-list.shared";
import { requireRefundAdmin, type RefundAdminUser } from "./refund.shared";

/**
 * Handles admin refund listing requests.
 */
export async function handleListRefunds(request: Request) {
  const auth = await requireRefundAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseRefundQuery(request, listRefundsQuerySchema);
  if (!query.success) return query.error;
  return listRefunds(query.data, auth.session.user);
}

/**
 * Handles admin single refund detail requests.
 */
export async function handleGetRefund(request: Request, refundId: string) {
  const auth = await requireRefundAdmin(request);
  if (!auth.success) return auth.error;
  try {
    const branchId = resolveRefundBranch(undefined, auth.session.user);
    const refund = await getDb().refund.findFirst({
      select: refundSelect(),
      where: { booking: branchId ? { branchId } : undefined, id: refundId },
    });
    if (!refund) throwRefundNotFound();
    return refundDetailResponse(refund);
  } catch (error) {
    return handleRefundError(error, {
      code: REFUND_CODES.REFUND_LOAD_FAILED,
      handler: "handleGetRefund",
      message: REFUND_MESSAGES.REFUND_LOAD_FAILED,
    });
  }
}

/**
 * Lists refunds with branch-admin scoping through booking branch.
 */
async function listRefunds(input: ListRefundsQueryInput, admin: RefundAdminUser) {
  try {
    const branchId = resolveRefundBranch(input.branchId, admin);
    const refunds = await getDb().refund.findMany({
      orderBy: [{ requestedAt: "desc" }],
      select: refundSelect(),
      take: input.limit,
      where: {
        booking: branchId ? { branchId } : undefined,
        bookingId: input.bookingId,
        paymentId: input.paymentId,
        status: input.status,
      },
    });
    return refundListResponse(refunds, input.limit);
  } catch (error) {
    return handleRefundError(error, {
      code: REFUND_CODES.REFUND_LOAD_FAILED,
      handler: "listRefunds",
      message: REFUND_MESSAGES.REFUND_LOAD_FAILED,
    });
  }
}
