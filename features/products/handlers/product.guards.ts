import { getDb } from "@/db";
import {
  PRODUCT_CODES,
  PRODUCT_MESSAGES,
} from "@/features/products/constants/product.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  ProductVisibleError,
  type ProductAdminUser,
} from "./product.shared";

/**
 * Ensures branch admins only manage their assigned branch.
 */
export function assertCanManageProductBranch(
  admin: ProductAdminUser,
  branchId: string | null | undefined,
) {
  if (admin.role === "SUPER_ADMIN") return;
  if (branchId && admin.branchId === branchId) return;
  throw new ProductVisibleError(
    PRODUCT_CODES.FORBIDDEN,
    PRODUCT_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}

/**
 * Verifies the target branch is active before product writes.
 */
export async function assertActiveProductBranch(branchId: string) {
  const branch = await getDb().branch.findFirst({
    select: { id: true },
    where: { id: branchId, isActive: true },
  });
  if (branch) return;
  throw new ProductVisibleError(
    PRODUCT_CODES.BRANCH_NOT_FOUND,
    PRODUCT_MESSAGES.BRANCH_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Loads one product and verifies admin branch ownership.
 */
export async function loadManageableProduct(
  productId: string,
  admin: ProductAdminUser,
) {
  const product = await getDb().product.findUnique({
    select: { branchId: true, id: true },
    where: { id: productId },
  });
  if (!product) throwProductNotFound();
  assertCanManageProductBranch(admin, product.branchId);
  return product;
}

/**
 * Throws a product not-found error for read and write paths.
 */
export function throwProductNotFound(): never {
  throw new ProductVisibleError(
    PRODUCT_CODES.PRODUCT_NOT_FOUND,
    PRODUCT_MESSAGES.PRODUCT_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
