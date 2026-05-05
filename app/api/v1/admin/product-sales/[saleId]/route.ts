import {
  handleGetProductSale,
  handleUpdateProductSale,
} from "@/features/product-sales/handlers/product-sale.handlers";

export const runtime = "nodejs";

type AdminProductSaleRouteContext = {
  params: Promise<{ saleId: string }>;
};

/**
 * Routes admin product sale detail requests to the feature handler.
 */
export async function GET(request: Request, context: AdminProductSaleRouteContext) {
  const { saleId } = await context.params;
  return handleGetProductSale(request, saleId);
}

/**
 * Routes admin product sale patch requests to the feature handler.
 */
export async function PATCH(request: Request, context: AdminProductSaleRouteContext) {
  const { saleId } = await context.params;
  return handleUpdateProductSale(request, saleId);
}
