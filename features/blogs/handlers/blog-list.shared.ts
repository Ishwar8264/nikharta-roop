/**
 * Purpose: Shared blog list handler helpers.
 * Responsibility: Parse list queries and wrap collection responses.
 * Important Notes: Keeps public and admin list response shapes aligned.
 */
import { z } from "zod";

import { BLOG_CODES, BLOG_MESSAGES } from "@/features/blogs/constants/blog.constants";
import type {
  BlogCategoryRow,
  BlogPostRow,
} from "@/features/blogs/helpers/blog.mapper";
import {
  toPublicBlogCategory,
  toPublicBlogPost,
} from "@/features/blogs/helpers/blog.mapper";
import { blogError, blogJson } from "@/features/blogs/responses/blog.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Parses blog list query strings with feature-owned errors.
 */
export function parseBlogQuery<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (parsed.success) {
    return { data: parsed.data as z.output<TSchema>, success: true as const };
  }
  return {
    error: blogError({
      code: BLOG_CODES.VALIDATION_ERROR,
      message: BLOG_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Wraps a blog post collection in the shared response shape.
 */
export function blogListResponse(posts: BlogPostRow[], limit: number) {
  return blogJson({
    code: BLOG_CODES.BLOGS_LISTED,
    data: { blogs: posts.map(toPublicBlogPost), limit },
    message: BLOG_MESSAGES.BLOGS_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}

/**
 * Wraps a blog category collection in the shared response shape.
 */
export function blogCategoryListResponse(categories: BlogCategoryRow[]) {
  return blogJson({
    code: BLOG_CODES.CATEGORIES_LISTED,
    data: { categories: categories.map(toPublicBlogCategory) },
    message: BLOG_MESSAGES.CATEGORIES_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
