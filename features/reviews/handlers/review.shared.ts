import type { ZodError, ZodType } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  REVIEW_CODES,
  REVIEW_MESSAGES,
} from "@/features/reviews/constants/review.constants";
import { reviewError } from "@/features/reviews/responses/review.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type ReviewAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

export async function requireReviewAuth(request: Request) {
  return getAuthenticatedSession(request);
}

export async function requireReviewAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: reviewError({
        code: REVIEW_CODES.FORBIDDEN,
        message: REVIEW_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

export async function parseReviewBody<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: reviewError({
        code: REVIEW_CODES.VALIDATION_ERROR,
        message: getValidationMessage(parsed.error),
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data, error: null };
}

export function assertCanManageReviewBranch(
  admin: ReviewAdminUser,
  branchId: string,
) {
  if (admin.role === "SUPER_ADMIN" || admin.branchId === branchId) return;
  throw new ReviewVisibleError(
    REVIEW_CODES.FORBIDDEN,
    REVIEW_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}

export function handleReviewError(error: unknown, code: string, message: string) {
  if (error instanceof ReviewVisibleError) {
    return reviewError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  console.error(code, { error });
  return reviewError({
    code,
    message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

export class ReviewVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}

function getValidationMessage(error: ZodError) {
  return error.issues[0]?.message ?? REVIEW_MESSAGES.VALIDATION_ERROR;
}
