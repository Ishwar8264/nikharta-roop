import type { Prisma } from "@prisma/client";

/**
 * Selects staff commission fields exposed by admin APIs.
 */
export const staffCommissionSelect = () =>
  ({
    baseAmount: true,
    booking: {
      select: { bookingDate: true, branchId: true, displayId: true, id: true, status: true },
    },
    bookingId: true,
    commissionAmount: true,
    commissionRate: true,
    createdAt: true,
    id: true,
    paidAt: true,
    productSale: {
      select: { branchId: true, id: true, soldAt: true, status: true, totalAmount: true },
    },
    productSaleId: true,
    staff: {
      select: {
        branch: { select: { city: true, id: true, nameEn: true, nameHi: true } },
        branchId: true,
        id: true,
        user: { select: { id: true, mobile: true, name: true } },
      },
    },
    staffId: true,
    status: true,
    updatedAt: true,
  }) satisfies Prisma.StaffCommissionSelect;
