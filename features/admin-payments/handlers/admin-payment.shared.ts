import type { ZodType } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import {
  ADMIN_PAYMENT_CODES,
  ADMIN_PAYMENT_MESSAGES,
} from "@/features/admin-payments/constants/admin-payment.constants";
import { adminPaymentError } from "@/features/admin-payments/responses/admin-payment.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type AdminPaymentActor = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach admin payment handlers.
 */
export async function requireAdminPaymentActor(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: adminPaymentError({
        code: ADMIN_PAYMENT_CODES.FORBIDDEN,
        message: ADMIN_PAYMENT_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses admin payment query strings with feature-owned validation errors.
 */
export function parseAdminPaymentQuery<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (parsed.success) return { data: parsed.data, success: true as const };
  return {
    error: adminPaymentError({
      code: ADMIN_PAYMENT_CODES.VALIDATION_ERROR,
      message: ADMIN_PAYMENT_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Carries expected admin payment errors across helper boundaries.
 */
export class AdminPaymentVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
