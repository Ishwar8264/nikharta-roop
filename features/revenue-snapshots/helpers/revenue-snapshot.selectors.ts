import type { Prisma } from "@prisma/client";

/**
 * Selects revenue snapshot fields exposed by admin APIs.
 */
export const revenueSnapshotSelect = () =>
  ({
    advanceRevenue: true,
    bookingCount: true,
    branch: { select: { city: true, id: true, nameEn: true, nameHi: true } },
    branchId: true,
    cancelledCount: true,
    completedCount: true,
    createdAt: true,
    date: true,
    discountTotal: true,
    grossRevenue: true,
    id: true,
    updatedAt: true,
  }) satisfies Prisma.RevenueSnapshotSelect;
