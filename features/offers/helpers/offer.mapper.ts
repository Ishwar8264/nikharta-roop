import type { Prisma } from "@prisma/client";

import { offerRedemptionSelect, offerSelect } from "./offer.selectors";

type OfferRow = Prisma.OfferGetPayload<{
  select: ReturnType<typeof offerSelect>;
}>;

export type OfferRedemptionRow = Prisma.OfferRedemptionGetPayload<{
  select: ReturnType<typeof offerRedemptionSelect>;
}>;

type OfferServiceRow = OfferRow["services"][number];

/**
 * Converts an offer row into the public API shape.
 */
export function toPublicOffer(offer: OfferRow) {
  return {
    branch: offer.branch,
    branchId: offer.branchId,
    code: offer.code,
    createdAt: offer.createdAt,
    descriptionHi: offer.descriptionHi,
    discountType: offer.discountType,
    discountValue: offer.discountValue.toString(),
    id: offer.id,
    isActive: offer.isActive,
    maxDiscount: offer.maxDiscount?.toString() ?? null,
    minOrder: offer.minOrder?.toString() ?? null,
    perUserLimit: offer.perUserLimit,
    services: offer.services.map(toPublicOfferService),
    titleEn: offer.titleEn,
    titleHi: offer.titleHi,
    updatedAt: offer.updatedAt,
    usageCount: offer.usageCount,
    usageLimit: offer.usageLimit,
    validFrom: offer.validFrom,
    validUntil: offer.validUntil,
  };
}

/**
 * Converts one offer-service relation into an API-safe shape.
 */
function toPublicOfferService(service: OfferServiceRow) {
  return {
    createdAt: service.createdAt,
    service: service.service,
    serviceId: service.serviceId,
  };
}

/**
 * Converts one offer redemption row into the API shape.
 */
export function toPublicOfferRedemption(redemption: OfferRedemptionRow) {
  return {
    ...redemption,
    discountAmount: redemption.discountAmount.toString(),
  };
}
