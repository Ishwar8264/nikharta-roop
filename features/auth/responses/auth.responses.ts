import type { ApiJsonInput } from "@/types/auth/auth.types";

import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

/**
 * Creates the standard API JSON response.
 *
 * Every auth endpoint should use this wrapper so frontend code can rely on
 * `{ success, code, message, data }` for both success and failure states.
 */
export function authJson(input: ApiJsonInput) {
  return Response.json(
    {
      code: input.code,
      data: input.data ?? null,
      message: input.message,
      success: input.success,
    },
    {
      status:
        input.status ?? (input.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST),
    },
  );
}

/**
 * Creates a standard auth error response.
 *
 * Use this for validation, duplicate account, unauthorized, and server errors
 * instead of hand-writing JSON in individual route handlers.
 */
export function authError(input: {
  code: string;
  message: string;
  status?: HttpStatus;
}) {
  return authJson({
    code: input.code,
    data: null,
    message: input.message,
    status: input.status,
    success: false,
  });
}
