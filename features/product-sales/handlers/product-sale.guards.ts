import { getDb } from "@/db";
import {
  PRODUCT_SALE_CODES,
  PRODUCT_SALE_MESSAGES,
} from "@/features/product-sales/constants/product-sale.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  ProductSaleVisibleError,
  type ProductSaleAdminUser,
} from "./product-sale.shared";

/**
 * Ensures branch admins only manage their assigned branch.
 */
export function assertCanManageProductSaleBranch(
  admin: ProductSaleAdminUser,
  branchId: string,
) {
  if (admin.role === "SUPER_ADMIN" || admin.branchId === branchId) return;
  throw new ProductSaleVisibleError(
    PRODUCT_SALE_CODES.FORBIDDEN,
    PRODUCT_SALE_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}

/**
 * Verifies the branch exists and is active before sale writes.
 */
export async function assertActiveProductSaleBranch(branchId: string) {
  const branch = await getDb().branch.findFirst({
    select: { id: true },
    where: { id: branchId, isActive: true },
  });
  if (branch) return;
  throw new ProductSaleVisibleError(
    PRODUCT_SALE_CODES.BRANCH_NOT_FOUND,
    PRODUCT_SALE_MESSAGES.BRANCH_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Loads a sale and verifies admin branch scope.
 */
export async function loadManageableProductSale(
  saleId: string,
  admin: ProductSaleAdminUser,
) {
  const sale = await getDb().productSale.findUnique({
    select: { branchId: true, id: true, status: true },
    where: { id: saleId },
  });
  if (!sale) return null;
  assertCanManageProductSaleBranch(admin, sale.branchId);
  return sale;
}
