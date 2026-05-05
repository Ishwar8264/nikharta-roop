export const runtime = "nodejs";

/**
 * Routes public blog category listing requests to the blogs feature handler.
 */
export { handleListBlogCategories as GET } from "@/features/blogs/handlers/blog.handlers";
