export const runtime = "nodejs";

/**
 * Routes admin product list and create requests to feature handlers.
 */
export {
  handleCreateProduct as POST,
  handleListAdminProducts as GET,
} from "@/features/products/handlers/product.handlers";
