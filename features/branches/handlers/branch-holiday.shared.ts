import { z } from "zod";

import { getDb } from "@/db";
import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  BRANCH_CODES,
  BRANCH_MESSAGES,
} from "@/features/branches/constants/branch.constants";
import { branchError } from "@/features/branches/responses/branch.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type BranchHolidayAdmin = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to manage branch holidays.
 */
export async function requireBranchHolidayAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: branchError({
        code: BRANCH_CODES.FORBIDDEN,
        message: BRANCH_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with branch-owned validation error codes.
 */
export async function parseBranchHolidayBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: branchError({
        code: BRANCH_CODES.VALIDATION_ERROR,
        message: parsed.error.issues[0]?.message ?? BRANCH_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data as z.output<TSchema>, error: null };
}

/**
 * Ensures the admin can manage the requested branch.
 */
export function assertCanManageHolidayBranch(
  admin: BranchHolidayAdmin,
  branchId: string,
) {
  if (admin.role === "SUPER_ADMIN" || admin.branchId === branchId) return;
  throw new BranchHolidayVisibleError(
    BRANCH_CODES.FORBIDDEN,
    BRANCH_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}

/**
 * Confirms a branch exists before writing holiday rows.
 */
export async function assertHolidayBranchExists(branchId: string) {
  const branch = await getDb().branch.findUnique({
    select: { id: true },
    where: { id: branchId },
  });
  if (!branch) {
    throw new BranchHolidayVisibleError(
      BRANCH_CODES.BRANCH_NOT_FOUND,
      BRANCH_MESSAGES.BRANCH_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }
}

/**
 * Carries expected branch holiday errors across helper boundaries.
 */
export class BranchHolidayVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
