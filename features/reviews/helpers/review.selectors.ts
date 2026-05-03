import type { Prisma } from "@prisma/client";

/**
 * Selects review fields exposed by review APIs.
 */
export const reviewSelect = () =>
  ({
    bookingId: true,
    commentHi: true,
    createdAt: true,
    id: true,
    isApproved: true,
    photoUrls: true,
    rating: true,
    service: { select: { id: true, nameEn: true, nameHi: true } },
    staff: { select: { id: true, user: { select: { name: true } } } },
    updatedAt: true,
    user: { select: { id: true, name: true } },
  }) satisfies Prisma.ReviewSelect;
