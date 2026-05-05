import { handleUpdateProduct } from "@/features/products/handlers/product.handlers";

export const runtime = "nodejs";

type AdminProductRouteContext = {
  params: Promise<{ productId: string }>;
};

/**
 * Routes admin product patch requests to the products feature handler.
 */
export async function PATCH(request: Request, context: AdminProductRouteContext) {
  const { productId } = await context.params;
  return handleUpdateProduct(request, productId);
}
