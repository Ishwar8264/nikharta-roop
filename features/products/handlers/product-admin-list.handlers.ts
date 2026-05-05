import { getDb } from "@/db";
import {
  PRODUCT_CODES,
  PRODUCT_MESSAGES,
} from "@/features/products/constants/product.constants";
import { productCategorySelect, productSelect } from "@/features/products/helpers/product.selectors";
import {
  listProductCategoriesQuerySchema,
  listProductsQuerySchema,
  type ListProductsQueryInput,
} from "@/schema/products/schema.product";
import { handleProductError } from "./product.errors";
import {
  parseProductQuery,
  productCategoryListResponse,
  productListResponse,
} from "./product-list.shared";
import { resolveAdminProductBranch } from "./product-admin.shared";
import { requireProductAdmin } from "./product.shared";

/**
 * Handles admin product category listing requests.
 */
export async function handleListAdminProductCategories(request: Request) {
  const auth = await requireProductAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseProductQuery(request, listProductCategoriesQuerySchema);
  if (!query.success) return query.error;
  try {
    const branchId = resolveAdminProductBranch(query.data.branchId, auth.session.user);
    const categories = await getDb().productCategory.findMany({
      orderBy: [{ nameHi: "asc" }],
      select: productCategorySelect(),
      take: query.data.limit,
      where: categoryListWhere(branchId),
    });
    return productCategoryListResponse(categories, query.data.limit);
  } catch (error) {
    return handleProductError(error, {
      code: PRODUCT_CODES.PRODUCTS_LOAD_FAILED,
      handler: "handleListAdminProductCategories",
      message: PRODUCT_MESSAGES.PRODUCTS_LOAD_FAILED,
    });
  }
}

/**
 * Handles admin product listing requests.
 */
export async function handleListAdminProducts(request: Request) {
  const auth = await requireProductAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseProductQuery(request, listProductsQuerySchema);
  if (!query.success) return query.error;
  try {
    const branchId = resolveAdminProductBranch(query.data.branchId, auth.session.user);
    const products = await getDb().product.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: productSelect(),
      take: query.data.limit,
      where: productListWhere(query.data, branchId),
    });
    return productListResponse(products, query.data.limit);
  } catch (error) {
    return handleProductError(error, {
      code: PRODUCT_CODES.PRODUCTS_LOAD_FAILED,
      handler: "handleListAdminProducts",
      message: PRODUCT_MESSAGES.PRODUCTS_LOAD_FAILED,
    });
  }
}

/**
 * Builds admin category list filters without narrowing super admins by default.
 */
function categoryListWhere(branchId: string | undefined) {
  return branchId ? { OR: [{ branchId: null }, { branchId }] } : undefined;
}

/**
 * Builds admin product list filters from validated query input.
 */
function productListWhere(input: ListProductsQueryInput, branchId: string | undefined) {
  return {
    branchId,
    category: input.categorySlug ? { slug: input.categorySlug } : undefined,
    categoryId: input.categoryId,
  };
}
