/**
 * Purpose: Public blog handlers.
 * Responsibility: List active categories, list published posts, and load published details.
 * Important Notes: Public reads only expose published posts in active categories.
 */
import { BlogPostStatus } from "@prisma/client";

import { getDb } from "@/db";
import { BLOG_CODES, BLOG_MESSAGES } from "@/features/blogs/constants/blog.constants";
import { toPublicBlogPost } from "@/features/blogs/helpers/blog.mapper";
import {
  blogCategorySelect,
  blogPostSelect,
} from "@/features/blogs/helpers/blog.selectors";
import { blogError, blogJson } from "@/features/blogs/responses/blog.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { listBlogsQuerySchema } from "@/schema/blogs/schema.blog";
import { blogCategoryListResponse, blogListResponse, parseBlogQuery } from "./blog-list.shared";

/**
 * Handles public blog category listing requests.
 */
export async function handleListBlogCategories() {
  const categories = await getDb().blogCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameHi: "asc" }],
    select: blogCategorySelect(),
    where: { isActive: true },
  });
  return blogCategoryListResponse(categories);
}

/**
 * Handles public published blog listing requests.
 */
export async function handleListBlogs(request: Request) {
  const query = parseBlogQuery(request, listBlogsQuerySchema);
  if (!query.success) return query.error;
  const posts = await getDb().blogPost.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: blogPostSelect(),
    take: query.data.limit ?? 20,
    where: {
      category: { isActive: true, slug: query.data.categorySlug },
      status: BlogPostStatus.PUBLISHED,
    },
  });
  return blogListResponse(posts, query.data.limit ?? 20);
}

/**
 * Handles public published blog detail requests by slug.
 */
export async function handleGetBlogBySlug(_: Request, slug: string) {
  const post = await getDb().blogPost.findFirst({
    select: blogPostSelect(),
    where: {
      category: { isActive: true },
      slug,
      status: BlogPostStatus.PUBLISHED,
    },
  });
  if (!post) {
    return blogError({
      code: BLOG_CODES.BLOG_NOT_FOUND,
      message: BLOG_MESSAGES.BLOG_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    });
  }
  return blogJson({
    code: BLOG_CODES.BLOG_LOADED,
    data: { blog: toPublicBlogPost(post) },
    message: BLOG_MESSAGES.BLOG_LOADED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
