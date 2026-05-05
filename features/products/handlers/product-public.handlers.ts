import { getDb } from "@/db";
import {
  PRODUCT_CODES,
  PRODUCT_MESSAGES,
} from "@/features/products/constants/product.constants";
import { toPublicProduct } from "@/features/products/helpers/product.mapper";
import {
  productCategorySelect,
  productSelect,
} from "@/features/products/helpers/product.selectors";
import { productError, productJson } from "@/features/products/responses/product.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  listProductCategoriesQuerySchema,
  listProductsQuerySchema,
} from "@/schema/products/schema.product";
import {
  parseProductQuery,
  productCategoryListResponse,
  productListResponse,
} from "./product-list.shared";

/**
 * Handles public product category listing requests.
 */
export async function handleListProductCategories(request: Request) {
  const query = parseProductQuery(request, listProductCategoriesQuerySchema);
  if (!query.success) return query.error;
  const categories = await getDb().productCategory.findMany({
    orderBy: [{ nameHi: "asc" }],
    select: productCategorySelect(),
    take: query.data.limit,
    where: {
      OR: [{ branchId: null }, { branchId: query.data.branchId }],
      isActive: true,
    },
  });
  return productCategoryListResponse(categories, query.data.limit);
}

/**
 * Handles public active product listing requests.
 */
export async function handleListProducts(request: Request) {
  const query = parseProductQuery(request, listProductsQuerySchema);
  if (!query.success) return query.error;
  const products = await getDb().product.findMany({
    orderBy: [{ nameHi: "asc" }],
    select: productSelect(),
    take: query.data.limit,
    where: {
      branch: { isActive: true },
      branchId: query.data.branchId,
      category: query.data.categorySlug
        ? { isActive: true, slug: query.data.categorySlug }
        : undefined,
      categoryId: query.data.categoryId,
      isActive: true,
    },
  });
  return productListResponse(products, query.data.limit);
}

/**
 * Handles public active product detail requests.
 */
export async function handleGetProduct(request: Request, productId: string) {
  const branchId = new URL(request.url).searchParams.get("branchId") ?? undefined;
  const product = await getDb().product.findFirst({
    select: productSelect(),
    where: {
      branch: { isActive: true },
      branchId,
      id: productId,
      isActive: true,
    },
  });
  if (!product) {
    return productError({
      code: PRODUCT_CODES.PRODUCT_NOT_FOUND,
      message: PRODUCT_MESSAGES.PRODUCT_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    });
  }
  return productJson({
    code: PRODUCT_CODES.PRODUCT_LOADED,
    data: { product: toPublicProduct(product) },
    message: PRODUCT_MESSAGES.PRODUCT_LOADED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
