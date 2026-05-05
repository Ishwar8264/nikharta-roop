export const runtime = "nodejs";

/**
 * Routes public product listing requests to the products feature handler.
 */
export { handleListProducts as GET } from "@/features/products/handlers/product.handlers";
