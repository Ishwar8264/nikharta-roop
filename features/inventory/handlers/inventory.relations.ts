import { getDb } from "@/db";
import {
  INVENTORY_CODES,
  INVENTORY_MESSAGES,
} from "@/features/inventory/constants/inventory.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { InventoryVisibleError } from "./inventory.shared";

/**
 * Verifies an optional product belongs to the selected active branch.
 */
export async function assertInventoryProduct(
  productId: string | null | undefined,
  branchId: string,
) {
  if (!productId) return;
  const product = await getDb().product.findFirst({
    select: { id: true },
    where: { branchId, id: productId, isActive: true },
  });
  if (product) return;
  throw new InventoryVisibleError(
    INVENTORY_CODES.PRODUCT_NOT_FOUND,
    INVENTORY_MESSAGES.PRODUCT_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Resolves admin branch scope for list endpoints.
 */
export function resolveInventoryBranch(
  requestedBranchId: string | undefined,
  admin: { branchId?: string | null; role: string },
) {
  if (admin.role === "SUPER_ADMIN") return requestedBranchId;
  if (admin.branchId && (!requestedBranchId || requestedBranchId === admin.branchId)) {
    return admin.branchId;
  }
  throw new InventoryVisibleError(
    INVENTORY_CODES.FORBIDDEN,
    INVENTORY_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}
