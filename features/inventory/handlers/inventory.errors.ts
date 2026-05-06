import { Prisma } from "@prisma/client";

import {
  INVENTORY_CODES,
  INVENTORY_MESSAGES,
} from "@/features/inventory/constants/inventory.constants";
import { inventoryError } from "@/features/inventory/responses/inventory.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { InventoryVisibleError } from "./inventory.shared";

/**
 * Converts expected and unexpected inventory failures into safe responses.
 */
export function handleInventoryError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof InventoryVisibleError) {
    return inventoryError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  if (isUniqueConstraintError(error)) {
    return inventoryError({
      code: INVENTORY_CODES.SKU_DUPLICATE,
      message: INVENTORY_MESSAGES.SKU_DUPLICATE,
      status: HTTP_STATUS.CONFLICT,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return inventoryError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Detects Prisma unique constraint failures for inventory SKU rows.
 */
function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}
