import {
  PRODUCT_CODES,
  PRODUCT_MESSAGES,
} from "@/features/products/constants/product.constants";
import {
  toPublicProduct,
  toPublicProductCategory,
} from "@/features/products/helpers/product.mapper";
import { productJson } from "@/features/products/responses/product.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Wraps a category write result in the shared response shape.
 */
export function productCategoryResponse(
  category: Parameters<typeof toPublicProductCategory>[0],
  code: string,
) {
  const created = code === PRODUCT_CODES.CATEGORY_CREATED;
  return productJson({
    code,
    data: { category: toPublicProductCategory(category) },
    message: created
      ? PRODUCT_MESSAGES.CATEGORY_CREATED
      : PRODUCT_MESSAGES.CATEGORY_UPDATED,
    status: created ? HTTP_STATUS.CREATED : HTTP_STATUS.OK,
    success: true,
  });
}

/**
 * Wraps a product write result in the shared response shape.
 */
export function productWriteResponse(
  product: Parameters<typeof toPublicProduct>[0],
  code: string,
) {
  const created = code === PRODUCT_CODES.PRODUCT_CREATED;
  return productJson({
    code,
    data: { product: toPublicProduct(product) },
    message: created
      ? PRODUCT_MESSAGES.PRODUCT_CREATED
      : PRODUCT_MESSAGES.PRODUCT_UPDATED,
    status: created ? HTTP_STATUS.CREATED : HTTP_STATUS.OK,
    success: true,
  });
}
