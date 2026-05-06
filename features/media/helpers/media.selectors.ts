import type { Prisma } from "@prisma/client";

/**
 * Selects media asset fields exposed by admin APIs.
 */
export const mediaSelect = () =>
  ({
    altHi: true,
    blogPostId: true,
    branchId: true,
    createdAt: true,
    id: true,
    packageId: true,
    portfolioItemId: true,
    productId: true,
    provider: true,
    providerPublicId: true,
    reviewId: true,
    serviceId: true,
    sortOrder: true,
    staffId: true,
    url: true,
    ownerType: true,
  }) satisfies Prisma.MediaAssetSelect;
