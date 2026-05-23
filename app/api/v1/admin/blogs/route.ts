/**
 * Purpose: Admin blog collection API route.
 * Responsibility: Route admin blog list and create requests to feature handlers.
 * Important Notes: Handlers own authentication, validation, and response shape.
 */
export const runtime = "nodejs";

export {
  handleCreateBlogPost as POST,
  handleListAdminBlogs as GET,
} from "@/features/blogs/handlers/blog.handlers";
