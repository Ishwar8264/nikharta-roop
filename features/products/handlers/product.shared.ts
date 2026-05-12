import { z } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  PRODUCT_CODES,
  PRODUCT_MESSAGES,
} from "@/features/products/constants/product.constants";
import { productError } from "@/features/products/responses/product.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type ProductAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach product management handlers.
 */
export async function requireProductAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: productError({
        code: PRODUCT_CODES.FORBIDDEN,
        message: PRODUCT_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with product-owned validation error codes.
 */
export async function parseProductBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: productError({
        code: PRODUCT_CODES.VALIDATION_ERROR,
        message: parsed.error.issues[0]?.message ?? PRODUCT_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data as z.output<TSchema>, error: null };
}

/**
 * Carries expected product errors across helper boundaries.
 */
export class ProductVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
