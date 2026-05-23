/**
 * Purpose: Admin blog category collection API route.
 * Responsibility: Route admin category list and create requests to feature handlers.
 * Important Notes: Handlers own authentication, validation, and response shape.
 */
export const runtime = "nodejs";

export {
  handleCreateBlogCategory as POST,
  handleListAdminBlogCategories as GET,
} from "@/features/blogs/handlers/blog.handlers";
