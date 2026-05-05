export const runtime = "nodejs";

/**
 * Routes admin product category list and create requests to feature handlers.
 */
export {
  handleCreateProductCategory as POST,
  handleListAdminProductCategories as GET,
} from "@/features/products/handlers/product.handlers";
