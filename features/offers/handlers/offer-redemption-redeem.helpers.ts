import { BookingStatus } from "@prisma/client";

import { OFFER_CODES, OFFER_MESSAGES } from "@/features/offers/constants/offer.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { OfferVisibleError } from "./offer.shared";

type DecimalLike = { toString(): string };

/**
 * Ensures a booking can still receive a coupon discount.
 */
export function assertRedeemableBooking(booking: {
  discountAmount: DecimalLike;
  status: BookingStatus;
}) {
  if (booking.status !== BookingStatus.PENDING) {
    throwInvalid("Offer can be redeemed only before booking payment.");
  }
  if (Number(booking.discountAmount) > 0) throwDuplicate();
}

/**
 * Blocks coupon redemption once any payment row exists for the booking.
 */
export function assertNoBookingPayment(paymentCount: number) {
  if (paymentCount === 0) return;
  throwInvalid("Offer can be redeemed only before payment creation.");
}

/**
 * Blocks multiple coupon redemptions for the same booking.
 */
export function assertNoBookingRedemption(redemptionCount: number) {
  if (redemptionCount === 0) return;
  throwDuplicate();
}

/**
 * Throws an invalid-offer error with a user-safe reason.
 */
export function throwInvalid(message?: string): never {
  throw new OfferVisibleError(
    OFFER_CODES.OFFER_INVALID,
    message ?? OFFER_MESSAGES.OFFER_INVALID,
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
  );
}

/**
 * Throws a duplicate redemption error.
 */
function throwDuplicate(): never {
  throw new OfferVisibleError(
    OFFER_CODES.OFFER_REDEMPTION_DUPLICATE,
    OFFER_MESSAGES.OFFER_REDEMPTION_DUPLICATE,
    HTTP_STATUS.CONFLICT,
  );
}
