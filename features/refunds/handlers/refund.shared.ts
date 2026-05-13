import { z } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import { REFUND_CODES, REFUND_MESSAGES } from "@/features/refunds/constants/refund.constants";
import { refundError } from "@/features/refunds/responses/refund.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type RefundAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach refund management handlers.
 */
export async function requireRefundAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: refundError({
        code: REFUND_CODES.FORBIDDEN,
        message: REFUND_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with refund-owned validation errors.
 */
export async function parseRefundBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: refundError({
        code: REFUND_CODES.VALIDATION_ERROR,
        message: parsed.error.issues[0]?.message ?? REFUND_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data as z.output<TSchema>, error: null };
}

/**
 * Carries expected refund errors across helper boundaries.
 */
export class RefundVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
