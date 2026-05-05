import type { ZodType } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  PRODUCT_SALE_CODES,
  PRODUCT_SALE_MESSAGES,
} from "@/features/product-sales/constants/product-sale.constants";
import { productSaleError } from "@/features/product-sales/responses/product-sale.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type ProductSaleAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach product sale handlers.
 */
export async function requireProductSaleAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: productSaleError({
        code: PRODUCT_SALE_CODES.FORBIDDEN,
        message: PRODUCT_SALE_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with product-sale-owned validation errors.
 */
export async function parseProductSaleBody<T>(
  request: Request,
  schema: ZodType<T>,
) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: productSaleError({
        code: PRODUCT_SALE_CODES.VALIDATION_ERROR,
        message: parsed.error.issues[0]?.message ?? PRODUCT_SALE_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data, error: null };
}

/**
 * Carries expected product sale errors across helper boundaries.
 */
export class ProductSaleVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
