import type { ZodType } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  REVENUE_SNAPSHOT_CODES,
  REVENUE_SNAPSHOT_MESSAGES,
} from "@/features/revenue-snapshots/constants/revenue-snapshot.constants";
import { revenueSnapshotError } from "@/features/revenue-snapshots/responses/revenue-snapshot.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type RevenueSnapshotAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach revenue snapshot handlers.
 */
export async function requireRevenueSnapshotAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: revenueSnapshotError({
        code: REVENUE_SNAPSHOT_CODES.FORBIDDEN,
        message: REVENUE_SNAPSHOT_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with revenue snapshot-owned validation errors.
 */
export async function parseRevenueSnapshotBody<T>(
  request: Request,
  schema: ZodType<T>,
) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: revenueSnapshotError({
        code: REVENUE_SNAPSHOT_CODES.VALIDATION_ERROR,
        message:
          parsed.error.issues[0]?.message ?? REVENUE_SNAPSHOT_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data, error: null };
}

/**
 * Carries expected revenue snapshot errors across helper boundaries.
 */
export class RevenueSnapshotVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
