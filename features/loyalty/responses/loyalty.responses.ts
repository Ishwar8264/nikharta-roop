import type { ApiJsonInput } from "@/types/auth/auth.types";

import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

/**
 * Creates the standard API JSON response for loyalty endpoints.
 */
export function loyaltyJson(input: ApiJsonInput) {
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
 * Creates a standard loyalty error response.
 */
export function loyaltyError(input: {
  code: string;
  message: string;
  status?: HttpStatus;
}) {
  return loyaltyJson({
    code: input.code,
    data: null,
    message: input.message,
    status: input.status,
    success: false,
  });
}
