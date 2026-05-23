/**
 * Purpose: Blog Prisma selectors.
 * Responsibility: Define fields exposed by blog API handlers.
 * Important Notes: Shared by public and admin handlers to keep payloads consistent.
 */
import type { Prisma } from "@prisma/client";

/**
 * Selects blog category fields exposed by public and admin APIs.
 */
export const blogCategorySelect = () =>
  ({
    createdAt: true,
    description: true,
    id: true,
    isActive: true,
    nameEn: true,
    nameHi: true,
    slug: true,
    sortOrder: true,
    updatedAt: true,
  }) satisfies Prisma.BlogCategorySelect;

/**
 * Selects blog post fields exposed by public and admin APIs.
 */
export const blogPostSelect = () =>
  ({
    author: { select: { id: true, name: true } },
    authorId: true,
    category: { select: blogCategorySelect() },
    categoryId: true,
    contentHi: true,
    coverImageUrl: true,
    createdAt: true,
    excerptHi: true,
    id: true,
    publishedAt: true,
    slug: true,
    status: true,
    titleEn: true,
    titleHi: true,
    updatedAt: true,
  }) satisfies Prisma.BlogPostSelect;
