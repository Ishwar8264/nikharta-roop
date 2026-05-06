import type { Prisma } from "@prisma/client";

/**
 * Selects loyalty transaction fields exposed by APIs.
 */
export const loyaltyTransactionSelect = () =>
  ({
    booking: {
      select: {
        bookingDate: true,
        branchId: true,
        displayId: true,
        id: true,
        status: true,
      },
    },
    bookingId: true,
    createdAt: true,
    expiresAt: true,
    id: true,
    points: true,
    reasonHi: true,
    type: true,
    user: { select: { branchId: true, id: true, loyaltyPoints: true, mobile: true, name: true } },
    userId: true,
  }) satisfies Prisma.LoyaltyTransactionSelect;

/**
 * Selects user fields needed for loyalty summaries.
 */
export const loyaltyUserSelect = () =>
  ({
    id: true,
    branchId: true,
    loyaltyPoints: true,
    mobile: true,
    name: true,
  }) satisfies Prisma.UserSelect;
