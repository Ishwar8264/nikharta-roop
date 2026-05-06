import type { Prisma } from "@prisma/client";

/**
 * Selects inventory item fields exposed by admin APIs.
 */
export const inventorySelect = () =>
  ({
    branch: { select: { city: true, id: true, nameEn: true, nameHi: true } },
    branchId: true,
    costPerUnit: true,
    createdAt: true,
    id: true,
    isActive: true,
    nameEn: true,
    nameHi: true,
    product: { select: { id: true, nameEn: true, nameHi: true, slug: true } },
    productId: true,
    quantityOnHand: true,
    reorderLevel: true,
    sku: true,
    unit: true,
    updatedAt: true,
  }) satisfies Prisma.InventoryItemSelect;

/**
 * Selects inventory transaction fields exposed by admin APIs.
 */
export const inventoryTransactionSelect = () =>
  ({
    bookingId: true,
    createdAt: true,
    id: true,
    inventoryItem: {
      select: { branchId: true, id: true, nameEn: true, nameHi: true, sku: true },
    },
    inventoryItemId: true,
    notes: true,
    productSaleItemId: true,
    quantityChange: true,
    type: true,
    unitCost: true,
  }) satisfies Prisma.InventoryTransactionSelect;
