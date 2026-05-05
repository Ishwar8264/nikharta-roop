import { getDb } from "@/db";
import {
  PRODUCT_CODES,
  PRODUCT_MESSAGES,
} from "@/features/products/constants/product.constants";
import { productCategorySelect } from "@/features/products/helpers/product.selectors";
import {
  createProductCategorySchema,
  updateProductCategorySchema,
  type CreateProductCategoryInput,
  type UpdateProductCategoryInput,
} from "@/schema/products/schema.product";
import {
  assertProductCategoryBranch,
  loadManageableProductCategory,
  productCategorySlugScope,
} from "./product-category.guards";
import { handleProductError } from "./product.errors";
import {
  parseProductBody,
  requireProductAdmin,
  type ProductAdminUser,
} from "./product.shared";
import { productCategoryResponse } from "./product-write.responses";

/**
 * Handles admin product category creation requests.
 */
export async function handleCreateProductCategory(request: Request) {
  const auth = await requireProductAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseProductBody(request, createProductCategorySchema);
  if (body.error) return body.error;
  return createProductCategory(body.data, auth.session.user);
}

/**
 * Handles admin product category patch requests.
 */
export async function handleUpdateProductCategory(
  request: Request,
  categoryId: string,
) {
  const auth = await requireProductAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseProductBody(request, updateProductCategorySchema);
  if (body.error) return body.error;
  return updateProductCategory(categoryId, body.data, auth.session.user);
}

/**
 * Creates one global or branch-specific product category.
 */
async function createProductCategory(
  input: CreateProductCategoryInput,
  admin: ProductAdminUser,
) {
  try {
    await assertProductCategoryBranch(input.branchId, admin);
    const category = await getDb().productCategory.create({
      data: { ...input, slugScope: productCategorySlugScope(input.branchId) },
      select: productCategorySelect(),
    });
    return productCategoryResponse(category, PRODUCT_CODES.CATEGORY_CREATED);
  } catch (error) {
    return handleProductError(error, {
      code: PRODUCT_CODES.CATEGORY_CREATE_FAILED,
      handler: "createProductCategory",
      message: PRODUCT_MESSAGES.CATEGORY_CREATE_FAILED,
    });
  }
}

/**
 * Updates one product category after branch ownership validation.
 */
async function updateProductCategory(
  categoryId: string,
  input: UpdateProductCategoryInput,
  admin: ProductAdminUser,
) {
  try {
    const current = await loadManageableProductCategory(categoryId, admin);
    const branchId = input.branchId === undefined ? current.branchId : input.branchId;
    await assertProductCategoryBranch(branchId, admin);
    const category = await getDb().productCategory.update({
      data: { ...input, slugScope: productCategorySlugScope(branchId) },
      select: productCategorySelect(),
      where: { id: categoryId },
    });
    return productCategoryResponse(category, PRODUCT_CODES.CATEGORY_UPDATED);
  } catch (error) {
    return handleProductError(error, {
      code: PRODUCT_CODES.CATEGORY_UPDATE_FAILED,
      handler: "updateProductCategory",
      message: PRODUCT_MESSAGES.CATEGORY_UPDATE_FAILED,
    });
  }
}
