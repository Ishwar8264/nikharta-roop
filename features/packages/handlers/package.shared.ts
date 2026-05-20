/**
 * Purpose: Shared authorization, validation, and branch-scope helpers for package admin handlers.
 * Responsibilities: parse JSON bodies, enforce admin access, and convert expected errors into package responses.
 * Important notes: unassigned admins mirror branch management and can manage packages across branches.
 */
import { z } from "zod";

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
export async function parsePackageBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
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
  return { data: parsed.data as z.output<TSchema>, error: null };
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
 * Branch admins with an assigned branch stay limited; unassigned admins can manage all.
 */
export function assertCanManagePackageBranch(
  admin: PackageAdminUser,
  branchId: string | null,
) {
  if (
    admin.role === "SUPER_ADMIN" ||
    !admin.branchId ||
    (branchId && admin.branchId === branchId)
  ) {
    return;
  }
  throw new PackageVisibleError(
    PACKAGE_CODES.FORBIDDEN,
    PACKAGE_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}

/**
 * Resolves an optional admin branch filter into the visible branch scope.
 */
export function resolvePackageAdminBranchFilter(
  requestedBranchId: string | undefined,
  admin: PackageAdminUser,
) {
  if (admin.role === "SUPER_ADMIN" || !admin.branchId) return requestedBranchId;

  if (requestedBranchId && requestedBranchId !== admin.branchId) {
    throw new PackageVisibleError(
      PACKAGE_CODES.FORBIDDEN,
      PACKAGE_MESSAGES.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN,
    );
  }

  return admin.branchId;
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
