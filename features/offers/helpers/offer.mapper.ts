type DecimalLike = { toString(): string };

type OfferServiceRow = {
  createdAt: Date;
  service: {
    id: string;
    nameEn: string;
    nameHi: string;
    slug: string;
  };
  serviceId: string;
};

type OfferRow = {
  branch: {
    city: string;
    id: string;
    nameEn: string | null;
    nameHi: string;
  } | null;
  branchId: string | null;
  code: string;
  createdAt: Date;
  descriptionHi: string | null;
  discountType: string;
  discountValue: DecimalLike;
  id: string;
  isActive: boolean;
  maxDiscount: DecimalLike | null;
  minOrder: DecimalLike | null;
  perUserLimit: number | null;
  services: OfferServiceRow[];
  titleEn: string | null;
  titleHi: string;
  updatedAt: Date;
  usageCount: number;
  usageLimit: number | null;
  validFrom: Date;
  validUntil: Date;
};

export type OfferRedemptionRow = {
  booking: Record<string, unknown>;
  bookingId: string;
  createdAt: Date;
  discountAmount: DecimalLike;
  id: string;
  offer: Record<string, unknown>;
  offerId: string;
  user: Record<string, unknown>;
  userId: string;
};

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
