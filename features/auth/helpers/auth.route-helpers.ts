import { ZodError, type ZodType } from "zod";

import {
  AUTH_CODES,
  AUTH_MESSAGES,
} from "@/features/auth/constants/auth.constants";
import { authError } from "@/features/auth/responses/auth.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Reads a request JSON body safely.
 *
 * Invalid JSON should not throw through route handlers. Returning `null`
 * lets the zod parser produce a consistent validation response.
 */
export async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Parses request JSON with a zod schema.
 *
 * The return shape keeps route handlers simple: either `data` is available
 * or `error` is already a ready-to-return Response.
 */
export async function parseJsonBody<T>(request: Request, schema: ZodType<T>) {
  const body = await readJsonBody(request);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      data: null,
      error: authError({
        code: AUTH_CODES.VALIDATION_ERROR,
        message: getValidationMessage(parsed.error),
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }

  return {
    data: parsed.data,
    error: null,
  };
}

/**
 * Picks the first user-friendly validation message from zod.
 *
 * Zod can return many issues, but API consumers usually need one clear
 * correction at a time.
 */
function getValidationMessage(error: ZodError) {
  return error.issues[0]?.message ?? AUTH_MESSAGES.INVALID_REQUEST_BODY;
}
