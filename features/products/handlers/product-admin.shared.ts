import {
  PRODUCT_CODES,
  PRODUCT_MESSAGES,
} from "@/features/products/constants/product.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { ProductVisibleError, type ProductAdminUser } from "./product.shared";

/**
 * Resolves admin branch scope for list endpoints.
 */
export function resolveAdminProductBranch(
  requestedBranchId: string | undefined,
  admin: ProductAdminUser,
) {
  if (admin.role === "SUPER_ADMIN") return requestedBranchId;
  if (admin.branchId && (!requestedBranchId || requestedBranchId === admin.branchId)) {
    return admin.branchId;
  }
  throw new ProductVisibleError(
    PRODUCT_CODES.FORBIDDEN,
    PRODUCT_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}
