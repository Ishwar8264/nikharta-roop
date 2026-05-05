import { getDb } from "@/db";
import {
  PRODUCT_CODES,
  PRODUCT_MESSAGES,
} from "@/features/products/constants/product.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  assertCanManageProductBranch,
  assertActiveProductBranch,
} from "./product.guards";
import {
  ProductVisibleError,
  type ProductAdminUser,
} from "./product.shared";

/**
 * Builds the unique slug scope stored for global or branch categories.
 */
export function productCategorySlugScope(branchId: string | null | undefined) {
  return branchId ?? "global";
}

/**
 * Validates category branch scope for create or update requests.
 */
export async function assertProductCategoryBranch(
  branchId: string | null | undefined,
  admin: ProductAdminUser,
) {
  assertCanManageProductBranch(admin, branchId);
  if (branchId) await assertActiveProductBranch(branchId);
}

/**
 * Verifies selected category can be used by a product in one branch.
 */
export async function assertProductCategory(
  categoryId: string | null | undefined,
  branchId: string,
) {
  if (!categoryId) return;
  const category = await getDb().productCategory.findFirst({
    select: { id: true },
    where: {
      id: categoryId,
      isActive: true,
      OR: [{ branchId: null }, { branchId }],
    },
  });
  if (category) return;
  throw new ProductVisibleError(
    PRODUCT_CODES.CATEGORY_NOT_FOUND,
    PRODUCT_MESSAGES.CATEGORY_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Loads one category and verifies admin branch ownership.
 */
export async function loadManageableProductCategory(
  categoryId: string,
  admin: ProductAdminUser,
) {
  const category = await getDb().productCategory.findUnique({
    select: { branchId: true, id: true },
    where: { id: categoryId },
  });
  if (!category) {
    throw new ProductVisibleError(
      PRODUCT_CODES.CATEGORY_NOT_FOUND,
      PRODUCT_MESSAGES.CATEGORY_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }
  assertCanManageProductBranch(admin, category.branchId);
  return category;
}
