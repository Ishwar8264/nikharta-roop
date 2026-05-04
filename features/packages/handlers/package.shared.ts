import type { ZodType } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  PACKAGE_CODES,
  PACKAGE_MESSAGES,
} from "@/features/packages/constants/package.constants";
import { packageError } from "@/features/packages/responses/package.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type PackageAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Parses JSON request bodies with package-owned validation error codes.
 */
export async function parsePackageBody<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: packageError({
        code: PACKAGE_CODES.VALIDATION_ERROR,
        message:
          parsed.error.issues[0]?.message ?? PACKAGE_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data, error: null };
}

/**
 * Allows only admin roles to reach package management handlers.
 */
export async function requirePackageAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: packageError({
        code: PACKAGE_CODES.FORBIDDEN,
        message: PACKAGE_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Branch admins stay limited to their assigned branch; super admins are global.
 */
export function assertCanManagePackageBranch(
  admin: PackageAdminUser,
  branchId: string | null,
) {
  if (admin.role === "SUPER_ADMIN" || (branchId && admin.branchId === branchId)) {
    return;
  }
  throw new PackageVisibleError(
    PACKAGE_CODES.FORBIDDEN,
    PACKAGE_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}

/**
 * Carries expected package errors across helper boundaries.
 */
export class PackageVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
