export const runtime = "nodejs";

/**
 * Routes admin blog category list and create requests to feature handlers.
 */
export {
  handleCreateBlogCategory as POST,
  handleListAdminBlogCategories as GET,
} from "@/features/blogs/handlers/blog.handlers";
