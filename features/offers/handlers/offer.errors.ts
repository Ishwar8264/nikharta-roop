import {
  OFFER_CODES,
  OFFER_MESSAGES,
} from "@/features/offers/constants/offer.constants";
import { offerError } from "@/features/offers/responses/offer.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { OfferVisibleError } from "./offer.shared";

/**
 * Converts expected offer failures into user-safe responses.
 */
export function handleOfferError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof OfferVisibleError) {
    return offerError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  if (isUniqueError(error)) {
    return offerError({
      code: OFFER_CODES.OFFER_DUPLICATE,
      message: OFFER_MESSAGES.OFFER_DUPLICATE,
      status: HTTP_STATUS.CONFLICT,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return offerError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Builds validation-error responses for malformed offer requests.
 */
export function offerValidationError(message?: string) {
  return offerError({
    code: OFFER_CODES.VALIDATION_ERROR,
    message: message ?? OFFER_MESSAGES.VALIDATION_ERROR,
    status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
  });
}

/**
 * Builds invalid-offer responses for coupons that cannot be applied.
 */
export function offerInvalidError(message?: string) {
  return offerError({
    code: OFFER_CODES.OFFER_INVALID,
    message: message ?? OFFER_MESSAGES.OFFER_INVALID,
    status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
  });
}

/**
 * Detects Prisma unique constraint failures, mainly duplicate offer codes.
 */
function isUniqueError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
