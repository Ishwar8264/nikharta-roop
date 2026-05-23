/**
 * Purpose: Shared blog feature data contracts.
 * Responsibility: Type public/admin blog payloads consumed by pages and components.
 * Important Notes: Dates are strings after handler JSON serialization.
 */
import type { BlogPostStatus } from "@prisma/client";

export type PublicBlogCategory = {
  createdAt?: string;
  description?: string | null;
  id: string;
  isActive: boolean;
  nameEn?: string | null;
  nameHi: string;
  slug: string;
  sortOrder: number;
  updatedAt?: string;
};

export type PublicBlogPost = {
  author?: { id?: string; name: string | null } | null;
  authorId?: string | null;
  category: PublicBlogCategory;
  categoryId: string;
  contentHi: string;
  coverImageUrl?: string | null;
  createdAt?: string;
  excerptHi?: string | null;
  id: string;
  publishedAt?: string | null;
  slug: string;
  status: BlogPostStatus;
  titleEn?: string | null;
  titleHi: string;
  updatedAt?: string;
};

export type BlogListResult = {
  blogs: PublicBlogPost[];
  error: string | null;
  limit: number;
};

export type BlogCategoryListResult = {
  categories: PublicBlogCategory[];
  error: string | null;
};

export type BlogDetailResult = {
  blog: PublicBlogPost | null;
  error: string | null;
};

export type BlogCategoryOption = Pick<
  PublicBlogCategory,
  "id" | "nameEn" | "nameHi"
>;

export type BlogActionState = {
  message: string;
  success: boolean;
};
