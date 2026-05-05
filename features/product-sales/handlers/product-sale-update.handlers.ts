import { ProductSaleStatus } from "@prisma/client";

import { getDb } from "@/db";
import {
  PRODUCT_SALE_CODES,
  PRODUCT_SALE_MESSAGES,
} from "@/features/product-sales/constants/product-sale.constants";
import { productSaleSelect } from "@/features/product-sales/helpers/product-sale.selectors";
import {
  updateProductSaleSchema,
  type UpdateProductSaleInput,
} from "@/schema/product-sales/schema.product-sale";
import { handleProductSaleError, throwProductSaleNotFound } from "./product-sale.errors";
import { loadManageableProductSale } from "./product-sale.guards";
import { productSaleDetailResponse } from "./product-sale-list.shared";
import {
  parseProductSaleBody,
  ProductSaleVisibleError,
  requireProductSaleAdmin,
} from "./product-sale.shared";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { decrementSaleStock } from "./product-sale-stock";

/**
 * Handles admin product sale patch requests.
 */
export async function handleUpdateProductSale(request: Request, saleId: string) {
  const auth = await requireProductSaleAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseProductSaleBody(request, updateProductSaleSchema);
  if (body.error) return body.error;
  return updateProductSale(saleId, body.data, auth.session.user);
}

/**
 * Updates sale notes or moves draft sales into a terminal status.
 */
async function updateProductSale(
  saleId: string,
  input: UpdateProductSaleInput,
  admin: { branchId?: string | null; id: string; role: string },
) {
  try {
    const current = await loadManageableProductSale(saleId, admin);
    if (!current) throwProductSaleNotFound();
    assertProductSaleStatus(current.status, input.status);
    const sale = await getDb().$transaction(async (tx) => {
      if (input.status === ProductSaleStatus.COMPLETED) await decrementSaleStock(tx, saleId);
      return tx.productSale.update({
        data: {
          notes: input.notes,
          soldAt: input.status === ProductSaleStatus.COMPLETED ? new Date() : undefined,
          status: input.status,
        },
        select: productSaleSelect(),
        where: { id: saleId },
      });
    });
    return productSaleDetailResponse(sale, PRODUCT_SALE_CODES.PRODUCT_SALE_UPDATED);
  } catch (error) {
    return handleProductSaleError(error, {
      code: PRODUCT_SALE_CODES.PRODUCT_SALE_UPDATE_FAILED,
      handler: "updateProductSale",
      message: PRODUCT_SALE_MESSAGES.PRODUCT_SALE_UPDATE_FAILED,
    });
  }
}

/**
 * Allows note-only edits anytime and status changes only from draft.
 */
function assertProductSaleStatus(current: ProductSaleStatus, next?: ProductSaleStatus) {
  if (!next || current === ProductSaleStatus.DRAFT) return;
  throw new ProductSaleVisibleError(
    PRODUCT_SALE_CODES.INVALID_STATUS,
    PRODUCT_SALE_MESSAGES.INVALID_STATUS,
    HTTP_STATUS.CONFLICT,
  );
}
