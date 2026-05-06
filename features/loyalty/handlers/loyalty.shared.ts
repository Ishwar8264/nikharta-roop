import type { ZodType } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import { LOYALTY_CODES, LOYALTY_MESSAGES } from "@/features/loyalty/constants/loyalty.constants";
import { loyaltyError } from "@/features/loyalty/responses/loyalty.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type LoyaltyAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach loyalty management handlers.
 */
export async function requireLoyaltyAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: loyaltyError({
        code: LOYALTY_CODES.FORBIDDEN,
        message: LOYALTY_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with loyalty-owned validation errors.
 */
export async function parseLoyaltyBody<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: loyaltyError({
        code: LOYALTY_CODES.VALIDATION_ERROR,
        message: parsed.error.issues[0]?.message ?? LOYALTY_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data, error: null };
}

/**
 * Carries expected loyalty errors across helper boundaries.
 */
export class LoyaltyVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
