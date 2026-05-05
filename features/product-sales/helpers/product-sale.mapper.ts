type DecimalLike = { toString(): string };

type ProductSaleItemRow = {
  id: string;
  lineTotal: DecimalLike;
  product: { id: string; nameEn: string | null; nameHi: string; slug: string };
  productId: string;
  quantity: number;
  unitPrice: DecimalLike;
};

export type ProductSaleRow = {
  branch: Record<string, unknown>;
  branchId: string;
  createdAt: Date;
  discountAmount: DecimalLike;
  id: string;
  items: ProductSaleItemRow[];
  notes: string | null;
  soldAt: Date | null;
  status: string;
  subtotal: DecimalLike;
  totalAmount: DecimalLike;
  updatedAt: Date;
  user: Record<string, unknown> | null;
  userId: string | null;
};

/**
 * Converts a product sale row into the admin API shape.
 */
export function toPublicProductSale(sale: ProductSaleRow) {
  return {
    ...sale,
    discountAmount: sale.discountAmount.toString(),
    items: sale.items.map(toPublicProductSaleItem),
    subtotal: sale.subtotal.toString(),
    totalAmount: sale.totalAmount.toString(),
  };
}

/**
 * Converts one sale item into an API-safe shape.
 */
function toPublicProductSaleItem(item: ProductSaleItemRow) {
  return {
    ...item,
    lineTotal: item.lineTotal.toString(),
    unitPrice: item.unitPrice.toString(),
  };
}
