/**
 * Purpose: Public blog category API route.
 * Responsibility: Route active category list requests to the blogs feature handler.
 * Important Notes: Handler owns response shape.
 */
export const runtime = "nodejs";

export { handleListBlogCategories as GET } from "@/features/blogs/handlers/blog.handlers";
