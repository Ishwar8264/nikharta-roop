import type { z } from "zod";

import type {
  createBlogCommentSchema,
  createBlogPostSchema,
  createCategorySchema,
  listBlogPostsQuerySchema,
  listCategoriesQuerySchema,
  listCommentsQuerySchema,
  listTagsQuerySchema,
  publishBlogPostSchema,
  updateBlogCommentSchema,
  updateBlogPostSchema,
} from "./blog.schema";

export type ListBlogPostsQuery = z.infer<typeof listBlogPostsQuerySchema>;
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
export type PublishBlogPostInput = z.infer<typeof publishBlogPostSchema>;
export type CreateBlogCommentInput = z.infer<typeof createBlogCommentSchema>;
export type UpdateBlogCommentInput = z.infer<typeof updateBlogCommentSchema>;
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
export type ListTagsQuery = z.infer<typeof listTagsQuerySchema>;

/** Public author summary. */
export interface PublicAuthor {
  id: string;
  name: string | null;
  avatar: string | null;
}

/** Public tag summary. */
export interface PublicTag {
  id: string;
  name: string;
  slug: string;
}

/** Public category summary. */
export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

/**
 * Public blog post shape.
 *
 * Why:
 * `publishedAt` is separate from `published` so clients can render a "first
 * published" timestamp even when a post is currently unpublished. `views` is
 * exposed but not user-editable.
 */
export interface PublicBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  contentHtml: string | null;
  contentJson: string | null;
  coverImage: string | null;
  readingTime: number;
  views: number;
  published: boolean;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  tldr: string | null;
  author: PublicAuthor;
  category: PublicCategory | null;
  tags: PublicTag[];
  createdAt: Date;
  updatedAt: Date;
}

/** Public comment shape. */
export interface PublicComment {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  isApproved: boolean;
  createdAt: Date;
  author: PublicAuthor;
}

/** Cursor-paginated wrappers. */
export interface PaginatedBlogPosts {
  items: PublicBlogPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PaginatedComments {
  items: PublicComment[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PaginatedCategories {
  items: PublicCategory[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PaginatedTags {
  items: PublicTag[];
  nextCursor: string | null;
  hasMore: boolean;
}
