import { REFUND_CODES, REFUND_MESSAGES } from "@/features/refunds/constants/refund.constants";
import { refundError } from "@/features/refunds/responses/refund.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { RefundVisibleError } from "./refund.shared";

/**
 * Converts expected and unexpected refund failures into safe responses.
 */
export function handleRefundError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof RefundVisibleError) {
    return refundError({ code: error.code, message: error.message, status: error.status });
  }
  console.error(input.code, { error, handler: input.handler });
  return refundError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Throws a refund not-found error.
 */
export function throwRefundNotFound(): never {
  throw new RefundVisibleError(
    REFUND_CODES.REFUND_NOT_FOUND,
    REFUND_MESSAGES.REFUND_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
