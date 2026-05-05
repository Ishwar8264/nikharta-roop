import { getDb } from "@/db";
import {
  PRODUCT_SALE_CODES,
  PRODUCT_SALE_MESSAGES,
} from "@/features/product-sales/constants/product-sale.constants";
import { productSaleSelect } from "@/features/product-sales/helpers/product-sale.selectors";
import { handleProductSaleError, throwProductSaleNotFound } from "./product-sale.errors";
import { loadManageableProductSale } from "./product-sale.guards";
import { productSaleDetailResponse } from "./product-sale-list.shared";
import { requireProductSaleAdmin } from "./product-sale.shared";

/**
 * Handles admin product sale detail requests.
 */
export async function handleGetProductSale(request: Request, saleId: string) {
  const auth = await requireProductSaleAdmin(request);
  if (!auth.success) return auth.error;
  try {
    const current = await loadManageableProductSale(saleId, auth.session.user);
    if (!current) throwProductSaleNotFound();
    const sale = await getDb().productSale.findUnique({
      select: productSaleSelect(),
      where: { id: saleId },
    });
    if (!sale) throwProductSaleNotFound();
    return productSaleDetailResponse(sale);
  } catch (error) {
    return handleProductSaleError(error, {
      code: PRODUCT_SALE_CODES.PRODUCT_SALE_LOAD_FAILED,
      handler: "handleGetProductSale",
      message: PRODUCT_SALE_MESSAGES.PRODUCT_SALE_LOAD_FAILED,
    });
  }
}
