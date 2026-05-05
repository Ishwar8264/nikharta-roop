import type { Prisma } from "@prisma/client";

/**
 * Selects portfolio fields exposed by public and admin APIs.
 */
export const portfolioSelect = () =>
  ({
    afterImageUrl: true,
    beforeImageUrl: true,
    branch: { select: { city: true, id: true, nameEn: true, nameHi: true } },
    branchId: true,
    createdAt: true,
    descriptionHi: true,
    id: true,
    imageUrls: true,
    isFeatured: true,
    isPublished: true,
    package: { select: { id: true, nameEn: true, nameHi: true, slug: true } },
    packageId: true,
    service: { select: { id: true, nameEn: true, nameHi: true, slug: true } },
    serviceId: true,
    sortOrder: true,
    staff: { select: { id: true, photoUrl: true, user: { select: { name: true } } } },
    staffId: true,
    titleHi: true,
    updatedAt: true,
  }) satisfies Prisma.PortfolioItemSelect;
