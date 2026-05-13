import type { Prisma } from "@prisma/client";

import {
  inventorySelect,
  inventoryTransactionSelect,
} from "./inventory.selectors";

export type InventoryRow = Prisma.InventoryItemGetPayload<{
  select: ReturnType<typeof inventorySelect>;
}>;

export type InventoryTransactionRow = Prisma.InventoryTransactionGetPayload<{
  select: ReturnType<typeof inventoryTransactionSelect>;
}>;

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
