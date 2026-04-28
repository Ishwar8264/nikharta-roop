import type { ApiJsonInput } from "@/types/auth/auth.types";

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
      status: input.status ?? (input.success ? 200 : 400),
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
  status?: number;
}) {
  return authJson({
    code: input.code,
    data: null,
    message: input.message,
    status: input.status,
    success: false,
  });
}
