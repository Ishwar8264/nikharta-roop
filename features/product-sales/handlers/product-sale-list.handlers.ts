import { getDb } from "@/db";
import {
  PRODUCT_SALE_CODES,
  PRODUCT_SALE_MESSAGES,
} from "@/features/product-sales/constants/product-sale.constants";
import { productSaleSelect } from "@/features/product-sales/helpers/product-sale.selectors";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  listProductSalesQuerySchema,
  type ListProductSalesQueryInput,
} from "@/schema/product-sales/schema.product-sale";
import { handleProductSaleError } from "./product-sale.errors";
import { assertCanManageProductSaleBranch } from "./product-sale.guards";
import {
  parseProductSaleQuery,
  productSaleListResponse,
} from "./product-sale-list.shared";
import {
  ProductSaleVisibleError,
  requireProductSaleAdmin,
} from "./product-sale.shared";

/**
 * Handles admin product sale listing requests.
 */
export async function handleListProductSales(request: Request) {
  const auth = await requireProductSaleAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseProductSaleQuery(request, listProductSalesQuerySchema);
  if (!query.success) return query.error;
  return listProductSales(query.data, auth.session.user);
}

/**
 * Lists product sales with branch-admin scoping.
 */
async function listProductSales(
  input: ListProductSalesQueryInput,
  admin: { branchId?: string | null; id: string; role: string },
) {
  try {
    const branchId = resolveProductSaleBranch(input.branchId, admin);
    const sales = await getDb().productSale.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: productSaleSelect(),
      take: input.limit,
      where: {
        branchId,
        createdAt: input.date ? dayRange(input.date) : undefined,
        status: input.status,
        userId: input.userId,
      },
    });
    return productSaleListResponse(sales, input.limit);
  } catch (error) {
    return handleProductSaleError(error, {
      code: PRODUCT_SALE_CODES.PRODUCT_SALES_LOAD_FAILED,
      handler: "listProductSales",
      message: PRODUCT_SALE_MESSAGES.PRODUCT_SALES_LOAD_FAILED,
    });
  }
}

/**
 * Resolves admin branch scope for product sale lists.
 */
function resolveProductSaleBranch(
  requestedBranchId: string | undefined,
  admin: { branchId?: string | null; id: string; role: string },
) {
  if (admin.role === "SUPER_ADMIN") return requestedBranchId;
  if (admin.branchId && (!requestedBranchId || requestedBranchId === admin.branchId)) {
    assertCanManageProductSaleBranch(admin, admin.branchId);
    return admin.branchId;
  }
  throw new ProductSaleVisibleError(
    PRODUCT_SALE_CODES.FORBIDDEN,
    PRODUCT_SALE_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}

/**
 * Builds an inclusive day range for created-at filtering.
 */
function dayRange(date: string) {
  return {
    gte: new Date(`${date}T00:00:00.000Z`),
    lt: new Date(`${date}T23:59:59.999Z`),
  };
}
