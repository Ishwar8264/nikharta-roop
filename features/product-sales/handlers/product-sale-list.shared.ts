import { z } from "zod";

import {
  PRODUCT_SALE_CODES,
  PRODUCT_SALE_MESSAGES,
} from "@/features/product-sales/constants/product-sale.constants";
import type { ProductSaleRow } from "@/features/product-sales/helpers/product-sale.mapper";
import { toPublicProductSale } from "@/features/product-sales/helpers/product-sale.mapper";
import { productSaleError, productSaleJson } from "@/features/product-sales/responses/product-sale.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import type { HttpStatus } from "@/lib/constants/http-status";

/**
 * Parses product sale query strings with feature-owned errors.
 */
export function parseProductSaleQuery<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (parsed.success) {
    return { data: parsed.data as z.output<TSchema>, success: true as const };
  }
  return {
    error: productSaleError({
      code: PRODUCT_SALE_CODES.VALIDATION_ERROR,
      message: PRODUCT_SALE_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Wraps a product sale collection in the shared response shape.
 */
export function productSaleListResponse(sales: ProductSaleRow[], limit: number) {
  return productSaleJson({
    code: PRODUCT_SALE_CODES.PRODUCT_SALES_LISTED,
    data: { limit, productSales: sales.map(toPublicProductSale) },
    message: PRODUCT_SALE_MESSAGES.PRODUCT_SALES_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}

/**
 * Wraps one product sale in the shared response shape.
 */
export function productSaleDetailResponse(
  sale: ProductSaleRow,
  code: string = PRODUCT_SALE_CODES.PRODUCT_SALE_LOADED,
  status: HttpStatus = HTTP_STATUS.OK,
) {
  const messageByCode = {
    [PRODUCT_SALE_CODES.PRODUCT_SALE_CREATED]: PRODUCT_SALE_MESSAGES.PRODUCT_SALE_CREATED,
    [PRODUCT_SALE_CODES.PRODUCT_SALE_LOADED]: PRODUCT_SALE_MESSAGES.PRODUCT_SALE_LOADED,
    [PRODUCT_SALE_CODES.PRODUCT_SALE_UPDATED]: PRODUCT_SALE_MESSAGES.PRODUCT_SALE_UPDATED,
  };
  return productSaleJson({
    code,
    data: { productSale: toPublicProductSale(sale) },
    message: messageByCode[code as keyof typeof messageByCode],
    status,
    success: true,
  });
}
