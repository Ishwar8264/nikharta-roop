import { handleUpdateBlogCategory } from "@/features/blogs/handlers/blog.handlers";

export const runtime = "nodejs";

type AdminBlogCategoryRouteContext = {
  params: Promise<{ categoryId: string }>;
};

/**
 * Routes admin blog category patch requests to the blogs feature handler.
 */
export async function PATCH(
  request: Request,
  context: AdminBlogCategoryRouteContext,
) {
  const { categoryId } = await context.params;
  return handleUpdateBlogCategory(request, categoryId);
}
