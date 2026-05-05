import { getDb } from "@/db";
import { BLOG_CODES, BLOG_MESSAGES } from "@/features/blogs/constants/blog.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { BlogVisibleError } from "./blog.shared";

/**
 * Verifies a blog category exists and is active before public or admin use.
 */
export async function assertActiveBlogCategory(categoryId: string) {
  const category = await getDb().blogCategory.findFirst({
    select: { id: true },
    where: { id: categoryId, isActive: true },
  });
  if (category) return;
  throw new BlogVisibleError(
    BLOG_CODES.BLOG_CATEGORY_NOT_FOUND,
    BLOG_MESSAGES.BLOG_CATEGORY_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Loads a blog post id before update or delete operations.
 */
export async function assertBlogPostExists(blogId: string) {
  const post = await getDb().blogPost.findUnique({
    select: { id: true },
    where: { id: blogId },
  });
  if (post) return post;
  throw new BlogVisibleError(
    BLOG_CODES.BLOG_NOT_FOUND,
    BLOG_MESSAGES.BLOG_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Loads a blog category id before update operations.
 */
export async function assertBlogCategoryExists(categoryId: string) {
  const category = await getDb().blogCategory.findUnique({
    select: { id: true },
    where: { id: categoryId },
  });
  if (category) return category;
  throw new BlogVisibleError(
    BLOG_CODES.BLOG_CATEGORY_NOT_FOUND,
    BLOG_MESSAGES.BLOG_CATEGORY_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
