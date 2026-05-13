import { z } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import {
  REPORT_CODES,
  REPORT_MESSAGES,
} from "@/features/reports/constants/report.constants";
import { reportError } from "@/features/reports/responses/report.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type ReportAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach reporting handlers.
 */
export async function requireReportAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: reportError({
        code: REPORT_CODES.FORBIDDEN,
        message: REPORT_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses report query strings with report-owned validation errors.
 */
export function parseReportQuery<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (parsed.success) {
    return { data: parsed.data as z.output<TSchema>, success: true as const };
  }
  return {
    error: reportError({
      code: REPORT_CODES.VALIDATION_ERROR,
      message: REPORT_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Carries expected report errors across helper boundaries.
 */
export class ReportVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
