export const runtime = "nodejs";

/**
 * Routes public product category listing requests to the products feature handler.
 */
export { handleListProductCategories as GET } from "@/features/products/handlers/product.handlers";
