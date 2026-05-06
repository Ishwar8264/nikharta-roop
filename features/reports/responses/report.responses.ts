import type { ApiJsonInput } from "@/types/auth/auth.types";

import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

/**
 * Creates the standard API JSON response for report endpoints.
 */
export function reportJson(input: ApiJsonInput) {
  return Response.json(
    {
      code: input.code,
      data: input.data ?? null,
      message: input.message,
      success: input.success,
    },
    {
      headers: input.headers,
      status:
        input.status ?? (input.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST),
    },
  );
}

/**
 * Creates a standard report error response.
 */
export function reportError(input: {
  code: string;
  message: string;
  status?: HttpStatus;
}) {
  return reportJson({
    code: input.code,
    data: null,
    message: input.message,
    status: input.status,
    success: false,
  });
}
