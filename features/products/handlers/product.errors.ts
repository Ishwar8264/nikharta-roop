import { Prisma } from "@prisma/client";

import {
  PRODUCT_CODES,
  PRODUCT_MESSAGES,
} from "@/features/products/constants/product.constants";
import { productError } from "@/features/products/responses/product.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { ProductVisibleError } from "./product.shared";

/**
 * Converts expected and unexpected product failures into user-safe responses.
 */
export function handleProductError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof ProductVisibleError) {
    return productError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  if (isUniqueConstraintError(error)) {
    return productError({
      code: PRODUCT_CODES.SLUG_DUPLICATE,
      message: PRODUCT_MESSAGES.SLUG_DUPLICATE,
      status: HTTP_STATUS.CONFLICT,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return productError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Detects Prisma unique constraint failures for product slugs.
 */
function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}
