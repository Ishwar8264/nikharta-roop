/**
 * Purpose: Admin blog item API route.
 * Responsibility: Route admin blog update and delete requests to feature handlers.
 * Important Notes: Dynamic params follow Next.js 16 promise context shape.
 */
import {
  handleDeleteBlogPost,
  handleUpdateBlogPost,
} from "@/features/blogs/handlers/blog.handlers";

export const runtime = "nodejs";

type AdminBlogRouteContext = {
  params: Promise<{ blogId: string }>;
};

export async function PATCH(request: Request, context: AdminBlogRouteContext) {
  const { blogId } = await context.params;
  return handleUpdateBlogPost(request, blogId);
}

export async function DELETE(request: Request, context: AdminBlogRouteContext) {
  const { blogId } = await context.params;
  return handleDeleteBlogPost(request, blogId);
}
