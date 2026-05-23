/**
 * Purpose: Public blog detail API route.
 * Responsibility: Route slug lookups to the blogs feature handler.
 * Important Notes: Dynamic params follow Next.js 16 promise context shape.
 */
import { handleGetBlogBySlug } from "@/features/blogs/handlers/blog.handlers";

export const runtime = "nodejs";

type BlogSlugRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: BlogSlugRouteContext) {
  const { slug } = await context.params;
  return handleGetBlogBySlug(request, slug);
}
