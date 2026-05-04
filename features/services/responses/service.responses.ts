import type { ApiJsonInput } from "@/types/auth/auth.types";

import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

/**
 * Creates the standard API JSON response for service endpoints.
 */
export function serviceJson(input: ApiJsonInput) {
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
 * Creates a standard service error response.
 */
export function serviceError(input: {
  code: string;
  message: string;
  status?: HttpStatus;
}) {
  return serviceJson({
    code: input.code,
    data: null,
    message: input.message,
    status: input.status,
    success: false,
  });
}
