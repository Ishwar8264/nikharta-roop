import { handleGetBlogBySlug } from "@/features/blogs/handlers/blog.handlers";

export const runtime = "nodejs";

type BlogSlugRouteContext = {
  params: Promise<{ slug: string }>;
};

/**
 * Routes public blog detail requests to the blogs feature handler.
 */
export async function GET(request: Request, context: BlogSlugRouteContext) {
  const { slug } = await context.params;
  return handleGetBlogBySlug(request, slug);
}
