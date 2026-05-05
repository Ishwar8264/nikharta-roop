import type { ZodType } from "zod";

import {
  PRODUCT_CODES,
  PRODUCT_MESSAGES,
} from "@/features/products/constants/product.constants";
import type {
  ProductCategoryRow,
  ProductRow,
} from "@/features/products/helpers/product.mapper";
import {
  toPublicProduct,
  toPublicProductCategory,
} from "@/features/products/helpers/product.mapper";
import { productError, productJson } from "@/features/products/responses/product.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Parses product query strings with feature-owned validation errors.
 */
export function parseProductQuery<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (parsed.success) return { data: parsed.data, success: true as const };
  return {
    error: productError({
      code: PRODUCT_CODES.VALIDATION_ERROR,
      message: PRODUCT_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Wraps a product collection in the shared response shape.
 */
export function productListResponse(products: ProductRow[], limit: number) {
  return productJson({
    code: PRODUCT_CODES.PRODUCTS_LISTED,
    data: { limit, products: products.map(toPublicProduct) },
    message: PRODUCT_MESSAGES.PRODUCTS_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}

/**
 * Wraps a product category collection in the shared response shape.
 */
export function productCategoryListResponse(
  categories: ProductCategoryRow[],
  limit: number,
) {
  return productJson({
    code: PRODUCT_CODES.CATEGORY_LISTED,
    data: { categories: categories.map(toPublicProductCategory), limit },
    message: PRODUCT_MESSAGES.CATEGORY_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
