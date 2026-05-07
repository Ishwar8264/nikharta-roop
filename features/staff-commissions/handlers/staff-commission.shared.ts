import type { ZodType } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  STAFF_COMMISSION_CODES,
  STAFF_COMMISSION_MESSAGES,
} from "@/features/staff-commissions/constants/staff-commission.constants";
import { staffCommissionError } from "@/features/staff-commissions/responses/staff-commission.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type StaffCommissionAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach staff commission handlers.
 */
export async function requireStaffCommissionAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: staffCommissionError({
        code: STAFF_COMMISSION_CODES.FORBIDDEN,
        message: STAFF_COMMISSION_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with staff commission-owned validation errors.
 */
export async function parseStaffCommissionBody<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: staffCommissionError({
        code: STAFF_COMMISSION_CODES.VALIDATION_ERROR,
        message: parsed.error.issues[0]?.message ?? STAFF_COMMISSION_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data, error: null };
}

/**
 * Carries expected staff commission errors across helper boundaries.
 */
export class StaffCommissionVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
