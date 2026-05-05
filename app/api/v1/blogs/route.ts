export const runtime = "nodejs";

/**
 * Routes public blog listing requests to the blogs feature handler.
 */
export { handleListBlogs as GET } from "@/features/blogs/handlers/blog.handlers";
