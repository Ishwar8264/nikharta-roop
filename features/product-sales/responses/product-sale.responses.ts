import type { ApiJsonInput } from "@/types/auth/auth.types";

import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

/**
 * Creates the standard API JSON response for product sale endpoints.
 */
export function productSaleJson(input: ApiJsonInput) {
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
 * Creates a standard product sale error response.
 */
export function productSaleError(input: {
  code: string;
  message: string;
  status?: HttpStatus;
}) {
  return productSaleJson({
    code: input.code,
    data: null,
    message: input.message,
    status: input.status,
    success: false,
  });
}
