export const runtime = "nodejs";

/**
 * Routes admin blog list and create requests to feature handlers.
 */
export {
  handleCreateBlogPost as POST,
  handleListAdminBlogs as GET,
} from "@/features/blogs/handlers/blog.handlers";
