import type { ZodType } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  CONSULTATION_CODES,
  CONSULTATION_MESSAGES,
} from "@/features/consultations/constants/consultation.constants";
import { consultationError } from "@/features/consultations/responses/consultation.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type ConsultationAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

export async function requireConsultationAuth(request: Request) {
  return getAuthenticatedSession(request);
}

/**
 * Allows only admin roles to reach consultation management handlers.
 */
export async function requireConsultationAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: consultationError({
        code: CONSULTATION_CODES.FORBIDDEN,
        message: CONSULTATION_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with consultation-owned validation error codes.
 */
export async function parseConsultationBody<T>(
  request: Request,
  schema: ZodType<T>,
) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: consultationError({
        code: CONSULTATION_CODES.VALIDATION_ERROR,
        message:
          parsed.error.issues[0]?.message ??
          CONSULTATION_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data, error: null };
}

export class ConsultationVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
