import type { Prisma } from "@prisma/client";

/**
 * Selects expense fields exposed by admin APIs.
 */
export const expenseSelect = () =>
  ({
    amount: true,
    branch: { select: { city: true, id: true, nameEn: true, nameHi: true } },
    branchId: true,
    category: true,
    createdAt: true,
    createdBy: { select: { id: true, mobile: true, name: true } },
    createdById: true,
    expenseDate: true,
    id: true,
    notes: true,
    receiptUrl: true,
    titleHi: true,
    updatedAt: true,
    vendorName: true,
  }) satisfies Prisma.ExpenseSelect;
