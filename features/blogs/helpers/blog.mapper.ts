/**
 * Purpose: Blog API mappers.
 * Responsibility: Convert selected database rows into public API payloads.
 * Important Notes: Selectors define the database shape consumed by these mappers.
 */
import type { Prisma } from "@prisma/client";

import { blogCategorySelect, blogPostSelect } from "./blog.selectors";

export type BlogCategoryRow = Prisma.BlogCategoryGetPayload<{
  select: ReturnType<typeof blogCategorySelect>;
}>;

export type BlogPostRow = Prisma.BlogPostGetPayload<{
  select: ReturnType<typeof blogPostSelect>;
}>;

/**
 * Converts a blog category row into the public API shape.
 */
export function toPublicBlogCategory(category: BlogCategoryRow) {
  return category;
}

/**
 * Converts a blog post row into the public API shape.
 */
export function toPublicBlogPost(post: BlogPostRow) {
  return {
    ...post,
    category: toPublicBlogCategory(post.category),
  };
}
