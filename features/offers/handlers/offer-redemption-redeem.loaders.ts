import type { Prisma } from "@prisma/client";

import { offerSelect } from "@/features/offers/helpers/offer.selectors";
import type { RedeemOfferInput } from "@/schema/offers/schema.offer-redemption";
import { assertRedeemableBooking, throwInvalid } from "./offer-redemption-redeem.helpers";

/**
 * Loads the current user's booking and checks redeemable state.
 */
export async function loadRedeemableBooking(
  tx: Prisma.TransactionClient,
  userId: string,
  bookingId: string,
) {
  const booking = await tx.booking.findFirst({
    select: {
      branchId: true,
      discountAmount: true,
      id: true,
      serviceId: true,
      status: true,
      totalAmount: true,
    },
    where: { id: bookingId, userId },
  });
  if (!booking) throwInvalid("Booking was not found for this offer redemption.");
  assertRedeemableBooking(booking);
  return booking;
}

/**
 * Loads an active global or branch-scoped offer by coupon code.
 */
export async function loadRedeemableOffer(
  tx: Prisma.TransactionClient,
  branchId: string,
  code: string,
) {
  const now = new Date();
  const offer = await tx.offer.findFirst({
    select: { ...offerSelect(), services: { select: { serviceId: true } } },
    where: {
      code,
      isActive: true,
      OR: [{ branchId: null }, { branchId }],
      validFrom: { lte: now },
      validUntil: { gte: now },
    },
  });
  if (!offer) throwInvalid();
  return offer;
}

/**
 * Increments usage after validation inside the redemption transaction.
 */
export async function incrementOfferUsage(tx: Prisma.TransactionClient, offerId: string) {
  await tx.offer.update({ data: { usageCount: { increment: 1 } }, where: { id: offerId } });
}

/**
 * Shapes booking data into the existing offer validation helper input.
 */
export function redemptionValidationInput(
  booking: { branchId: string; serviceId: string | null; totalAmount: { toString(): string } },
  input: RedeemOfferInput,
) {
  return {
    branchId: booking.branchId,
    code: input.code,
    orderAmount: Number(booking.totalAmount),
    serviceIds: booking.serviceId ? [booking.serviceId] : [],
  };
}
