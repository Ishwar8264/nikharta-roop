import { handleGetProduct } from "@/features/products/handlers/product.handlers";

export const runtime = "nodejs";

type ProductRouteContext = {
  params: Promise<{ productId: string }>;
};

/**
 * Routes public product detail requests to the products feature handler.
 */
export async function GET(request: Request, context: ProductRouteContext) {
  const { productId } = await context.params;
  return handleGetProduct(request, productId);
}
