/**
 * Purpose: Stock mutation helpers for product sale completion.
 * Responsibilities: verify available stock and decrement product quantities inside a transaction.
 * Important notes: stock writes intentionally wait for the shortage check to prevent invalid decrements.
 */
import { Prisma } from "@prisma/client";

import {
  PRODUCT_SALE_CODES,
  PRODUCT_SALE_MESSAGES,
} from "@/features/product-sales/constants/product-sale.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { ProductSaleVisibleError } from "./product-sale.shared";

/**
 * Decrements product stock for every item in a completed sale.
 */
export async function decrementSaleStock(
  tx: Prisma.TransactionClient,
  saleId: string,
) {
  // The decrement writes must wait until all sale items are loaded and stock is verified.
  // react-doctor-disable-next-line react-doctor/async-parallel
  const items = await tx.productSaleItem.findMany({
    select: { productId: true, quantity: true },
    where: { saleId },
  });
  await assertSaleStock(tx, items);
  await Promise.all(
    items.map((item) =>
      tx.product.update({
        data: { stockQuantity: { decrement: item.quantity } },
        where: { id: item.productId },
      }),
    ),
  );
}

/**
 * Rechecks stock at completion time before mutating product rows.
 */
async function assertSaleStock(
  tx: Prisma.TransactionClient,
  items: Array<{ productId: string; quantity: number }>,
) {
  const products = await tx.product.findMany({
    select: { id: true, stockQuantity: true },
    where: { id: { in: items.map((item) => item.productId) } },
  });
  const productStock = new Map(products.map((product) => [product.id, product.stockQuantity]));
  const hasShortage = items.some(
    (item) => (productStock.get(item.productId) ?? 0) < item.quantity,
  );
  if (!hasShortage) return;
  throw new ProductSaleVisibleError(
    PRODUCT_SALE_CODES.STOCK_UNAVAILABLE,
    PRODUCT_SALE_MESSAGES.STOCK_UNAVAILABLE,
    HTTP_STATUS.CONFLICT,
  );
}
