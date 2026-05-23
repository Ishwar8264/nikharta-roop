/**
 * Purpose: Admin blog list handlers.
 * Responsibility: Authenticate admin reads and load blog posts/categories.
 * Important Notes: Response mapping stays shared with public blog list handlers.
 */
import { getDb } from "@/db";
import { blogCategorySelect, blogPostSelect } from "@/features/blogs/helpers/blog.selectors";
import { adminListBlogsQuerySchema } from "@/schema/blogs/schema.blog";
import { blogCategoryListResponse, blogListResponse, parseBlogQuery } from "./blog-list.shared";
import { requireBlogAdmin } from "./blog.shared";

/**
 * Handles admin blog category listing requests after admin authentication.
 */
export async function handleListAdminBlogCategories(request: Request) {
  const auth = await requireBlogAdmin(request);
  if (!auth.success) return auth.error;
  const categories = await getDb().blogCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameHi: "asc" }],
    select: blogCategorySelect(),
  });
  return blogCategoryListResponse(categories);
}

/**
 * Handles admin blog post listing requests after admin authentication.
 */
export async function handleListAdminBlogs(request: Request) {
  const auth = await requireBlogAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseBlogQuery(request, adminListBlogsQuerySchema);
  if (!query.success) return query.error;
  const posts = await getDb().blogPost.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: blogPostSelect(),
    take: query.data.limit ?? 50,
    where: {
      category: { slug: query.data.categorySlug },
      categoryId: query.data.categoryId,
      status: query.data.status,
    },
  });
  return blogListResponse(posts, query.data.limit ?? 50);
}
