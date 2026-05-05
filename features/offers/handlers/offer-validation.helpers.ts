import { DiscountType } from "@prisma/client";

import type { ValidateOfferInput } from "@/schema/offers/schema.offer";

type DecimalLike = { toString(): string };

type OfferValidationRow = {
  discountType: DiscountType;
  discountValue: DecimalLike;
  id: string;
  maxDiscount: DecimalLike | null;
  minOrder: DecimalLike | null;
  perUserLimit: number | null;
  services: { serviceId: string }[];
  usageCount: number;
  usageLimit: number | null;
};

/**
 * Explains why an otherwise active offer cannot be applied to the request.
 */
export function getOfferInvalidReason(
  offer: OfferValidationRow,
  input: ValidateOfferInput,
  userRedemptionCount: number,
) {
  if (offer.usageLimit !== null && offer.usageCount >= offer.usageLimit) {
    return "Offer usage limit has been reached.";
  }
  if (offer.perUserLimit !== null && userRedemptionCount >= offer.perUserLimit) {
    return "Offer user limit has been reached.";
  }
  if (offer.minOrder !== null && input.orderAmount < Number(offer.minOrder)) {
    return "Order amount is below the offer minimum.";
  }
  if (!isServiceEligible(offer.services, input.serviceIds)) {
    return "Offer is not valid for selected services.";
  }
  return null;
}

/**
 * Calculates the discount amount after percentage/flat logic and max caps.
 */
export function calculateDiscount(offer: OfferValidationRow, orderAmount: number) {
  const rawDiscount =
    offer.discountType === DiscountType.PERCENTAGE
      ? (orderAmount * Number(offer.discountValue)) / 100
      : Number(offer.discountValue);
  const cappedDiscount =
    offer.maxDiscount === null
      ? rawDiscount
      : Math.min(rawDiscount, Number(offer.maxDiscount));
  return Math.min(orderAmount, Math.max(0, roundMoney(cappedDiscount)));
}

/**
 * Checks service restrictions; offers without services apply to all services.
 */
function isServiceEligible(
  offerServices: { serviceId: string }[],
  requestedServiceIds: string[],
) {
  if (offerServices.length === 0) return true;
  if (requestedServiceIds.length === 0) return false;
  const allowed = new Set(offerServices.map((service) => service.serviceId));
  return requestedServiceIds.some((serviceId) => allowed.has(serviceId));
}

/**
 * Keeps money calculations stable at two decimal places.
 */
function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
