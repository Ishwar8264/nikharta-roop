import { getDb } from "@/db";
import {
  PRODUCT_SALE_CODES,
  PRODUCT_SALE_MESSAGES,
} from "@/features/product-sales/constants/product-sale.constants";
import { productSaleSelect } from "@/features/product-sales/helpers/product-sale.selectors";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  createProductSaleSchema,
  type CreateProductSaleInput,
} from "@/schema/product-sales/schema.product-sale";
import { buildProductSaleTotals } from "./product-sale-calculator";
import { handleProductSaleError } from "./product-sale.errors";
import {
  assertActiveProductSaleBranch,
  assertCanManageProductSaleBranch,
} from "./product-sale.guards";
import { productSaleDetailResponse } from "./product-sale-list.shared";
import {
  parseProductSaleBody,
  requireProductSaleAdmin,
  type ProductSaleAdminUser,
} from "./product-sale.shared";

/**
 * Handles admin product sale creation requests.
 */
export async function handleCreateProductSale(request: Request) {
  const auth = await requireProductSaleAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseProductSaleBody(request, createProductSaleSchema);
  if (body.error) return body.error;
  return createProductSale(body.data, auth.session.user);
}

/**
 * Creates a draft sale with line totals based on current product prices.
 */
async function createProductSale(
  input: CreateProductSaleInput,
  admin: ProductSaleAdminUser,
) {
  try {
    assertCanManageProductSaleBranch(admin, input.branchId);
    await assertActiveProductSaleBranch(input.branchId);
    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const products = await getDb().product.findMany({
      select: { id: true, price: true, stockQuantity: true },
      where: { branchId: input.branchId, id: { in: productIds }, isActive: true },
    });
    const totals = buildProductSaleTotals(input, products);
    const sale = await getDb().productSale.create({
      data: {
        branchId: input.branchId,
        discountAmount: totals.discountAmount,
        items: { create: totals.items },
        notes: input.notes,
        subtotal: totals.subtotal,
        totalAmount: totals.totalAmount,
        userId: input.userId,
      },
      select: productSaleSelect(),
    });
    return productSaleDetailResponse(
      sale,
      PRODUCT_SALE_CODES.PRODUCT_SALE_CREATED,
      HTTP_STATUS.CREATED,
    );
  } catch (error) {
    return handleProductSaleError(error, {
      code: PRODUCT_SALE_CODES.PRODUCT_SALE_CREATE_FAILED,
      handler: "createProductSale",
      message: PRODUCT_SALE_MESSAGES.PRODUCT_SALE_CREATE_FAILED,
    });
  }
}
