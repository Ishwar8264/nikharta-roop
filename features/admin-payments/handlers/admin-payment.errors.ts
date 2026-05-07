import {
  ADMIN_PAYMENT_CODES,
  ADMIN_PAYMENT_MESSAGES,
} from "@/features/admin-payments/constants/admin-payment.constants";
import { adminPaymentError } from "@/features/admin-payments/responses/admin-payment.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { AdminPaymentVisibleError } from "./admin-payment.shared";

/**
 * Converts expected and unexpected admin payment failures into safe responses.
 */
export function handleAdminPaymentError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof AdminPaymentVisibleError) {
    return adminPaymentError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return adminPaymentError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Throws an admin payment not-found error.
 */
export function throwAdminPaymentNotFound(): never {
  throw new AdminPaymentVisibleError(
    ADMIN_PAYMENT_CODES.PAYMENT_NOT_FOUND,
    ADMIN_PAYMENT_MESSAGES.PAYMENT_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
