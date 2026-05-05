import {
  handleDeleteBlogPost,
  handleUpdateBlogPost,
} from "@/features/blogs/handlers/blog.handlers";

export const runtime = "nodejs";

type AdminBlogRouteContext = {
  params: Promise<{ blogId: string }>;
};

/**
 * Routes admin blog patch requests to the blogs feature handler.
 */
export async function PATCH(request: Request, context: AdminBlogRouteContext) {
  const { blogId } = await context.params;
  return handleUpdateBlogPost(request, blogId);
}

/**
 * Routes admin blog delete requests to the blogs feature handler.
 */
export async function DELETE(request: Request, context: AdminBlogRouteContext) {
  const { blogId } = await context.params;
  return handleDeleteBlogPost(request, blogId);
}
