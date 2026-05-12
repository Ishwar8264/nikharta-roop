import { z } from "zod";

import { REFUND_CODES, REFUND_MESSAGES } from "@/features/refunds/constants/refund.constants";
import type { RefundRow } from "@/features/refunds/helpers/refund.mapper";
import { toPublicRefund } from "@/features/refunds/helpers/refund.mapper";
import { refundError, refundJson } from "@/features/refunds/responses/refund.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Parses refund query strings with feature-owned validation errors.
 */
export function parseRefundQuery<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (parsed.success) {
    return { data: parsed.data as z.output<TSchema>, success: true as const };
  }
  return {
    error: refundError({
      code: REFUND_CODES.VALIDATION_ERROR,
      message: REFUND_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Wraps a refund collection in the shared response shape.
 */
export function refundListResponse(refunds: RefundRow[], limit: number) {
  return refundJson({
    code: REFUND_CODES.REFUND_LISTED,
    data: { limit, refunds: refunds.map(toPublicRefund) },
    message: REFUND_MESSAGES.REFUND_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}

/**
 * Wraps one refund row in the shared response shape.
 */
export function refundDetailResponse(refund: RefundRow) {
  return refundJson({
    code: REFUND_CODES.REFUND_LOADED,
    data: { refund: toPublicRefund(refund) },
    message: REFUND_MESSAGES.REFUND_LOADED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
