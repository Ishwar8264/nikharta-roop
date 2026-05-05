import {
  PRODUCT_SALE_CODES,
  PRODUCT_SALE_MESSAGES,
} from "@/features/product-sales/constants/product-sale.constants";
import { productSaleError } from "@/features/product-sales/responses/product-sale.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { ProductSaleVisibleError } from "./product-sale.shared";

/**
 * Converts expected and unexpected product sale failures into safe responses.
 */
export function handleProductSaleError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof ProductSaleVisibleError) {
    return productSaleError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return productSaleError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Throws a product sale not-found error.
 */
export function throwProductSaleNotFound(): never {
  throw new ProductSaleVisibleError(
    PRODUCT_SALE_CODES.PRODUCT_SALE_NOT_FOUND,
    PRODUCT_SALE_MESSAGES.PRODUCT_SALE_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
