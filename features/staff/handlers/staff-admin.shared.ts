/**
 * Purpose: Shared authorization, validation, and error helpers for admin staff handlers.
 * Responsibilities: enforce admin roles, branch scope, JSON parsing, and user-safe write errors.
 * Important notes: unassigned admins mirror branch management and can manage every branch.
 */
import { z, type ZodError } from "zod";

import { getDb } from "@/db";
import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import { STAFF_CODES, STAFF_MESSAGES } from "@/features/staff/constants/staff.constants";
import { staffError } from "@/features/staff/responses/staff.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type StaffAdminUser = { branchId?: string | null; id: string; role: string };

/**
 * Allows only admin roles to reach staff management handlers.
 */
export async function requireStaffAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) return auth;

  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: staffError({
        code: STAFF_CODES.FORBIDDEN,
        message: STAFF_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }

  return auth;
}

/**
 * Parses JSON bodies with staff-owned validation errors.
 */
export async function parseStaffJsonBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(await readJsonBody(request));

  if (!parsed.success) {
    return {
      data: null,
      error: staffError({
        code: STAFF_CODES.VALIDATION_ERROR,
        message: getStaffValidationMessage(parsed.error),
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }

  return { data: parsed.data as z.output<TSchema>, error: null };
}

/**
 * Ensures assigned branch admins only manage their branch while unassigned admins can manage all.
 */
export function assertCanManageBranch(admin: StaffAdminUser, branchId: string) {
  if (admin.role === "SUPER_ADMIN" || !admin.branchId || admin.branchId === branchId) return;
  throw new StaffVisibleError(STAFF_CODES.FORBIDDEN, STAFF_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
}

/**
 * Resolves an optional admin branch filter into the visible branch scope.
 */
export function resolveAdminBranchFilter(
  requestedBranchId: string | undefined,
  admin: StaffAdminUser,
) {
  if (admin.role === "SUPER_ADMIN" || !admin.branchId) return requestedBranchId;
  if (requestedBranchId && requestedBranchId !== admin.branchId) {
    throw new StaffVisibleError(STAFF_CODES.FORBIDDEN, STAFF_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  return admin.branchId;
}

/**
 * Loads a staff profile and checks admin branch scope.
 */
export async function assertManageableStaff(staffId: string, admin: StaffAdminUser) {
  const staff = await getDb().staff.findUnique({
    select: { branchId: true, id: true },
    where: { id: staffId },
  });

  if (!staff) {
    throw new StaffVisibleError(STAFF_CODES.STAFF_NOT_FOUND, STAFF_MESSAGES.STAFF_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  assertCanManageBranch(admin, staff.branchId);
  return staff;
}

/**
 * Converts expected staff write failures into user-safe responses.
 */
export function handleStaffWriteError(error: unknown, code: string, message: string) {
  if (error instanceof StaffVisibleError) {
    return staffError({ code: error.code, message: error.message, status: error.status });
  }

  console.error(code, { error });
  return staffError({ code, message, status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
}

/**
 * Carries expected staff errors across helper boundaries.
 */
export class StaffVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}

function getStaffValidationMessage(error: ZodError) {
  return error.issues[0]?.message ?? STAFF_MESSAGES.VALIDATION_ERROR;
}
