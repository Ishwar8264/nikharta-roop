type DecimalLike = { toString(): string };

export type InventoryRow = {
  branch: Record<string, unknown>;
  branchId: string;
  costPerUnit: DecimalLike | null;
  createdAt: Date;
  id: string;
  isActive: boolean;
  nameEn: string | null;
  nameHi: string;
  product: Record<string, unknown> | null;
  productId: string | null;
  quantityOnHand: DecimalLike;
  reorderLevel: DecimalLike | null;
  sku: string | null;
  unit: string;
  updatedAt: Date;
};

export type InventoryTransactionRow = {
  bookingId: string | null;
  createdAt: Date;
  id: string;
  inventoryItem: Record<string, unknown>;
  inventoryItemId: string;
  notes: string | null;
  productSaleItemId: string | null;
  quantityChange: DecimalLike;
  type: string;
  unitCost: DecimalLike | null;
};

/**
 * Converts an inventory row into the admin API shape.
 */
export function toPublicInventory(item: InventoryRow) {
  return {
    ...item,
    costPerUnit: item.costPerUnit?.toString() ?? null,
    quantityOnHand: item.quantityOnHand.toString(),
    reorderLevel: item.reorderLevel?.toString() ?? null,
  };
}

/**
 * Converts one inventory transaction into the admin API shape.
 */
export function toPublicInventoryTransaction(transaction: InventoryTransactionRow) {
  return {
    ...transaction,
    quantityChange: transaction.quantityChange.toString(),
    unitCost: transaction.unitCost?.toString() ?? null,
  };
}
