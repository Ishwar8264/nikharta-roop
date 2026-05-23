/**
 * Purpose: Admin blog category item API route.
 * Responsibility: Route admin category update and delete requests to feature handlers.
 * Important Notes: Dynamic params follow Next.js 16 promise context shape.
 */
import {
  handleDeleteBlogCategory,
  handleUpdateBlogCategory,
} from "@/features/blogs/handlers/blog.handlers";

export const runtime = "nodejs";

type AdminBlogCategoryRouteContext = {
  params: Promise<{ categoryId: string }>;
};

export async function PATCH(
  request: Request,
  context: AdminBlogCategoryRouteContext,
) {
  const { categoryId } = await context.params;
  return handleUpdateBlogCategory(request, categoryId);
}

export async function DELETE(
  request: Request,
  context: AdminBlogCategoryRouteContext,
) {
  const { categoryId } = await context.params;
  return handleDeleteBlogCategory(request, categoryId);
}
