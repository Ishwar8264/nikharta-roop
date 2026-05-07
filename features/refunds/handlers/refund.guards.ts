import { getDb } from "@/db";
import { REFUND_CODES, REFUND_MESSAGES } from "@/features/refunds/constants/refund.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { RefundVisibleError, type RefundAdminUser } from "./refund.shared";

/**
 * Resolves the branch scope allowed for admin refund list requests.
 */
export function resolveRefundBranch(
  requestedBranchId: string | undefined,
  admin: RefundAdminUser,
) {
  if (admin.role === "SUPER_ADMIN") return requestedBranchId;
  if (admin.branchId && (!requestedBranchId || requestedBranchId === admin.branchId)) {
    return admin.branchId;
  }
  throwForbidden();
}

/**
 * Loads one refund and validates branch ownership through booking.
 */
export async function loadManageableRefund(refundId: string, admin: RefundAdminUser) {
  const refund = await getDb().refund.findUnique({
    select: {
      amount: true,
      booking: { select: { branchId: true } },
      id: true,
      paymentId: true,
      status: true,
    },
    where: { id: refundId },
  });
  if (!refund) return null;
  if (admin.role === "SUPER_ADMIN" || admin.branchId === refund.booking.branchId) return refund;
  throwForbidden();
}

/**
 * Throws a branch-scope authorization error.
 */
function throwForbidden(): never {
  throw new RefundVisibleError(
    REFUND_CODES.FORBIDDEN,
    REFUND_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}
