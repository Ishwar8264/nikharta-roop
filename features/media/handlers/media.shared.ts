import type { ZodType } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import { MEDIA_CODES, MEDIA_MESSAGES } from "@/features/media/constants/media.constants";
import { mediaError } from "@/features/media/responses/media.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type MediaAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach media handlers.
 */
export async function requireMediaAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: mediaError({
        code: MEDIA_CODES.FORBIDDEN,
        message: MEDIA_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with media-owned validation errors.
 */
export async function parseMediaBody<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: mediaError({
        code: MEDIA_CODES.VALIDATION_ERROR,
        message: parsed.error.issues[0]?.message ?? MEDIA_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data, error: null };
}

/**
 * Carries expected media errors across helper boundaries.
 */
export class MediaVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
