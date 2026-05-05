import { Prisma } from "@prisma/client";

import type { CreateProductSaleInput } from "@/schema/product-sales/schema.product-sale";
import { ProductSaleVisibleError } from "./product-sale.shared";
import {
  PRODUCT_SALE_CODES,
  PRODUCT_SALE_MESSAGES,
} from "@/features/product-sales/constants/product-sale.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";

type ProductForSale = { id: string; price: Prisma.Decimal; stockQuantity: number };

/**
 * Builds product sale line items and totals from current product prices.
 */
export function buildProductSaleTotals(
  input: CreateProductSaleInput,
  products: ProductForSale[],
) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const items = input.items.map((item) => {
    const product = productById.get(item.productId);
    if (!product) throwMissingProduct();
    if (product.stockQuantity < item.quantity) throwStockUnavailable();
    const quantity = new Prisma.Decimal(item.quantity);
    const lineTotal = product.price.mul(quantity);
    return {
      lineTotal,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
    };
  });
  const subtotal = items.reduce(
    (sum, item) => sum.add(item.lineTotal),
    new Prisma.Decimal(0),
  );
  const discountAmount = new Prisma.Decimal(input.discountAmount);
  return {
    discountAmount,
    items,
    subtotal,
    totalAmount: Prisma.Decimal.max(subtotal.sub(discountAmount), new Prisma.Decimal(0)),
  };
}

/**
 * Throws when one requested product cannot be sold in the selected branch.
 */
function throwMissingProduct(): never {
  throw new ProductSaleVisibleError(
    PRODUCT_SALE_CODES.PRODUCT_NOT_FOUND,
    PRODUCT_SALE_MESSAGES.PRODUCT_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Throws when one product does not have enough stock.
 */
function throwStockUnavailable(): never {
  throw new ProductSaleVisibleError(
    PRODUCT_SALE_CODES.STOCK_UNAVAILABLE,
    PRODUCT_SALE_MESSAGES.STOCK_UNAVAILABLE,
    HTTP_STATUS.CONFLICT,
  );
}
