import { z } from "zod";

import {
  INVENTORY_CODES,
  INVENTORY_MESSAGES,
} from "@/features/inventory/constants/inventory.constants";
import type {
  InventoryRow,
  InventoryTransactionRow,
} from "@/features/inventory/helpers/inventory.mapper";
import {
  toPublicInventory,
  toPublicInventoryTransaction,
} from "@/features/inventory/helpers/inventory.mapper";
import { inventoryError, inventoryJson } from "@/features/inventory/responses/inventory.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Parses inventory query strings with feature-owned validation errors.
 */
export function parseInventoryQuery<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (parsed.success) {
    return { data: parsed.data as z.output<TSchema>, success: true as const };
  }
  return {
    error: inventoryError({
      code: INVENTORY_CODES.VALIDATION_ERROR,
      message: INVENTORY_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Wraps an inventory collection in the shared response shape.
 */
export function inventoryListResponse(items: InventoryRow[], limit: number) {
  return inventoryJson({
    code: INVENTORY_CODES.INVENTORY_LISTED,
    data: { inventory: items.map(toPublicInventory), limit },
    message: INVENTORY_MESSAGES.INVENTORY_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}

/**
 * Wraps an inventory transaction collection in the shared response shape.
 */
export function inventoryTransactionListResponse(
  transactions: InventoryTransactionRow[],
  limit: number,
) {
  return inventoryJson({
    code: INVENTORY_CODES.TRANSACTIONS_LISTED,
    data: { limit, transactions: transactions.map(toPublicInventoryTransaction) },
    message: INVENTORY_MESSAGES.TRANSACTIONS_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
