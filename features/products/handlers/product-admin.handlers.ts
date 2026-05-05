import { getDb } from "@/db";
import {
  PRODUCT_CODES,
  PRODUCT_MESSAGES,
} from "@/features/products/constants/product.constants";
import { productSelect } from "@/features/products/helpers/product.selectors";
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/schema/products/schema.product";
import { assertProductCategory } from "./product-category.guards";
import { handleProductError } from "./product.errors";
import {
  assertActiveProductBranch,
  assertCanManageProductBranch,
  loadManageableProduct,
} from "./product.guards";
import {
  parseProductBody,
  requireProductAdmin,
  type ProductAdminUser,
} from "./product.shared";
import { productWriteResponse } from "./product-write.responses";

/**
 * Handles admin product creation requests.
 */
export async function handleCreateProduct(request: Request) {
  const auth = await requireProductAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseProductBody(request, createProductSchema);
  if (body.error) return body.error;
  return createProduct(body.data, auth.session.user);
}

/**
 * Handles admin product patch requests.
 */
export async function handleUpdateProduct(request: Request, productId: string) {
  const auth = await requireProductAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseProductBody(request, updateProductSchema);
  if (body.error) return body.error;
  return updateProduct(productId, body.data, auth.session.user);
}

/**
 * Creates one product after branch and category validation.
 */
async function createProduct(input: CreateProductInput, admin: ProductAdminUser) {
  try {
    assertCanManageProductBranch(admin, input.branchId);
    await assertActiveProductBranch(input.branchId);
    await assertProductCategory(input.categoryId, input.branchId);
    const product = await getDb().product.create({
      data: input,
      select: productSelect(),
    });
    return productWriteResponse(product, PRODUCT_CODES.PRODUCT_CREATED);
  } catch (error) {
    return handleProductError(error, {
      code: PRODUCT_CODES.PRODUCT_CREATE_FAILED,
      handler: "createProduct",
      message: PRODUCT_MESSAGES.PRODUCT_CREATE_FAILED,
    });
  }
}

/**
 * Updates one product while preserving branch ownership and category scope.
 */
async function updateProduct(
  productId: string,
  input: UpdateProductInput,
  admin: ProductAdminUser,
) {
  try {
    const current = await loadManageableProduct(productId, admin);
    const branchId = input.branchId ?? current.branchId;
    assertCanManageProductBranch(admin, branchId);
    await assertActiveProductBranch(branchId);
    await assertProductCategory(input.categoryId, branchId);
    const product = await getDb().product.update({
      data: input,
      select: productSelect(),
      where: { id: productId },
    });
    return productWriteResponse(product, PRODUCT_CODES.PRODUCT_UPDATED);
  } catch (error) {
    return handleProductError(error, {
      code: PRODUCT_CODES.PRODUCT_UPDATE_FAILED,
      handler: "updateProduct",
      message: PRODUCT_MESSAGES.PRODUCT_UPDATE_FAILED,
    });
  }
}
