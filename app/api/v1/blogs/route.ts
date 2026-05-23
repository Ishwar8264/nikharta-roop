/**
 * Purpose: Public blog list API route.
 * Responsibility: Route published blog list requests to the blogs feature handler.
 * Important Notes: Handler owns query validation and response shape.
 */
export const runtime = "nodejs";

export { handleListBlogs as GET } from "@/features/blogs/handlers/blog.handlers";
