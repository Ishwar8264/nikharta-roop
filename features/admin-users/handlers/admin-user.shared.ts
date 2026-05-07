import type { ZodType } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  ADMIN_USER_CODES,
  ADMIN_USER_MESSAGES,
} from "@/features/admin-users/constants/admin-user.constants";
import { adminUserError } from "@/features/admin-users/responses/admin-user.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type AdminUserActor = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach admin user handlers.
 */
export async function requireAdminUserActor(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: adminUserError({
        code: ADMIN_USER_CODES.FORBIDDEN,
        message: ADMIN_USER_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with admin user-owned validation errors.
 */
export async function parseAdminUserBody<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: adminUserError({
        code: ADMIN_USER_CODES.VALIDATION_ERROR,
        message:
          parsed.error.issues[0]?.message ?? ADMIN_USER_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data, error: null };
}

/**
 * Carries expected admin user errors across helper boundaries.
 */
export class AdminUserVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
