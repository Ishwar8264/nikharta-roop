export const runtime = "nodejs";

/**
 * Routes admin product sale list and create requests to feature handlers.
 */
export {
  handleCreateProductSale as POST,
  handleListProductSales as GET,
} from "@/features/product-sales/handlers/product-sale.handlers";
