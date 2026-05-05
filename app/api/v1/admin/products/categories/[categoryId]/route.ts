import { handleUpdateProductCategory } from "@/features/products/handlers/product.handlers";

export const runtime = "nodejs";

type AdminProductCategoryRouteContext = {
  params: Promise<{ categoryId: string }>;
};

/**
 * Routes admin product category patch requests to the products feature handler.
 */
export async function PATCH(
  request: Request,
  context: AdminProductCategoryRouteContext,
) {
  const { categoryId } = await context.params;
  return handleUpdateProductCategory(request, categoryId);
}
