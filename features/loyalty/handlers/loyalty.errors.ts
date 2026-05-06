import { LOYALTY_CODES, LOYALTY_MESSAGES } from "@/features/loyalty/constants/loyalty.constants";
import { loyaltyError } from "@/features/loyalty/responses/loyalty.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { LoyaltyVisibleError } from "./loyalty.shared";

/**
 * Converts expected and unexpected loyalty failures into safe responses.
 */
export function handleLoyaltyError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof LoyaltyVisibleError) {
    return loyaltyError({ code: error.code, message: error.message, status: error.status });
  }
  console.error(input.code, { error, handler: input.handler });
  return loyaltyError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Throws a customer not-found error for admin loyalty writes.
 */
export function throwLoyaltyUserNotFound(): never {
  throw new LoyaltyVisibleError(
    LOYALTY_CODES.USER_NOT_FOUND,
    LOYALTY_MESSAGES.USER_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
