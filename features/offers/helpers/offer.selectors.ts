import type { Prisma } from "@prisma/client";

/**
 * Selects offer fields exposed by public, validation, and admin APIs.
 */
export const offerSelect = () =>
  ({
    branch: { select: { city: true, id: true, nameEn: true, nameHi: true } },
    branchId: true,
    code: true,
    createdAt: true,
    descriptionHi: true,
    discountType: true,
    discountValue: true,
    id: true,
    isActive: true,
    maxDiscount: true,
    minOrder: true,
    perUserLimit: true,
    services: {
      select: {
        createdAt: true,
        service: { select: { id: true, nameEn: true, nameHi: true, slug: true } },
        serviceId: true,
      },
    },
    titleEn: true,
    titleHi: true,
    updatedAt: true,
    usageCount: true,
    usageLimit: true,
    validFrom: true,
    validUntil: true,
  }) satisfies Prisma.OfferSelect;
