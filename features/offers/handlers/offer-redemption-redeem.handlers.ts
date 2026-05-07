import { Prisma } from "@prisma/client";

import { getDb } from "@/db";
import { touchSession } from "@/features/auth/handlers/auth.handlers";
import { OFFER_CODES, OFFER_MESSAGES } from "@/features/offers/constants/offer.constants";
import { toPublicOfferRedemption } from "@/features/offers/helpers/offer.mapper";
import { offerRedemptionSelect } from "@/features/offers/helpers/offer.selectors";
import { offerJson } from "@/features/offers/responses/offer.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  redeemOfferSchema,
  type RedeemOfferInput,
} from "@/schema/offers/schema.offer-redemption";
import { handleOfferError } from "./offer.errors";
import { calculateDiscount, getOfferInvalidReason } from "./offer-validation.helpers";
import {
  assertNoBookingPayment,
  assertNoBookingRedemption,
  throwInvalid,
} from "./offer-redemption-redeem.helpers";
import {
  incrementOfferUsage,
  loadRedeemableBooking,
  loadRedeemableOffer,
  redemptionValidationInput,
} from "./offer-redemption-redeem.loaders";
import { parseOfferBody, requireOfferAuth } from "./offer.shared";

/**
 * Handles current user's coupon redemption for an existing booking.
 */
export async function handleRedeemOffer(request: Request) {
  const auth = await requireOfferAuth(request);
  if (!auth.success) return auth.error;
  const body = await parseOfferBody(request, redeemOfferSchema);
  if (body.error) return body.error;
  return redeemOffer(auth.session.id, auth.session.userId, body.data);
}

/**
 * Records one redemption and updates booking discount atomically.
 */
async function redeemOffer(sessionId: string, userId: string, input: RedeemOfferInput) {
  try {
    const redemption = await getDb().$transaction(
      async (tx) => redeemOfferInTransaction(tx, userId, input),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await touchSession(sessionId);
    return offerJson({
      code: OFFER_CODES.OFFER_REDEEMED,
      data: { redemption: toPublicOfferRedemption(redemption) },
      message: OFFER_MESSAGES.OFFER_REDEEMED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handleOfferError(error, {
      code: OFFER_CODES.OFFER_REDEEM_FAILED,
      handler: "redeemOffer",
      message: OFFER_MESSAGES.OFFER_REDEEM_FAILED,
    });
  }
}

/**
 * Runs booking, offer, usage, and redemption writes in one transaction.
 */
async function redeemOfferInTransaction(
  tx: Prisma.TransactionClient,
  userId: string,
  input: RedeemOfferInput,
) {
  const booking = await loadRedeemableBooking(tx, userId, input.bookingId);
  const offer = await loadRedeemableOffer(tx, booking.branchId, input.code);
  const [paymentCount, bookingRedemptionCount, userRedemptionCount] = await Promise.all([
    tx.payment.count({ where: { bookingId: booking.id } }),
    tx.offerRedemption.count({ where: { bookingId: booking.id } }),
    tx.offerRedemption.count({ where: { offerId: offer.id, userId } }),
  ]);
  assertNoBookingPayment(paymentCount);
  assertNoBookingRedemption(bookingRedemptionCount);
  const invalidReason = getOfferInvalidReason(
    offer,
    redemptionValidationInput(booking, input),
    userRedemptionCount,
  );
  if (invalidReason) throwInvalid(invalidReason);
  const discountAmount = calculateDiscount(offer, Number(booking.totalAmount));
  await incrementOfferUsage(tx, offer.id);
  await tx.booking.update({ data: { discountAmount }, where: { id: booking.id } });
  return tx.offerRedemption.create({
    data: { bookingId: booking.id, discountAmount, offerId: offer.id, userId },
    select: offerRedemptionSelect(),
  });
}
