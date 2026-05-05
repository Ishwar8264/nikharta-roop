import type { Prisma } from "@prisma/client";

/**
 * Selects product sale fields exposed by admin APIs.
 */
export const productSaleSelect = () =>
  ({
    branch: { select: { city: true, id: true, nameEn: true, nameHi: true } },
    branchId: true,
    createdAt: true,
    discountAmount: true,
    id: true,
    items: {
      orderBy: { id: "asc" },
      select: {
        id: true,
        lineTotal: true,
        product: { select: { id: true, nameEn: true, nameHi: true, slug: true } },
        productId: true,
        quantity: true,
        unitPrice: true,
      },
    },
    notes: true,
    soldAt: true,
    status: true,
    subtotal: true,
    totalAmount: true,
    updatedAt: true,
    user: { select: { id: true, mobile: true, name: true } },
    userId: true,
  }) satisfies Prisma.ProductSaleSelect;
