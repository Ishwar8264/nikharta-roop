import type { Prisma } from "@prisma/client";

/**
 * Selects branch holiday fields exposed by admin APIs.
 */
export const branchHolidaySelect = () =>
  ({
    branchId: true,
    createdAt: true,
    date: true,
    id: true,
    isClosed: true,
    reasonEn: true,
    reasonHi: true,
  }) satisfies Prisma.BranchHolidaySelect;
