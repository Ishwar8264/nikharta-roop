import {
  ADMIN_PAYMENT_CODES,
  ADMIN_PAYMENT_MESSAGES,
} from "@/features/admin-payments/constants/admin-payment.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  AdminPaymentVisibleError,
  type AdminPaymentActor,
} from "./admin-payment.shared";

/**
 * Resolves branch scope allowed for admin payment list requests.
 */
export function resolveAdminPaymentBranch(
  requestedBranchId: string | undefined,
  admin: AdminPaymentActor,
) {
  if (admin.role === "SUPER_ADMIN") return requestedBranchId;
  if (admin.branchId && (!requestedBranchId || requestedBranchId === admin.branchId)) {
    return admin.branchId;
  }
  throw new AdminPaymentVisibleError(
    ADMIN_PAYMENT_CODES.FORBIDDEN,
    ADMIN_PAYMENT_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}
