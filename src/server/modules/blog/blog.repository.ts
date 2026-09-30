import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Shared select for public blog post reads. */
const PUBLIC_POST_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  contentHtml: true,
  contentJson: true,
  coverImage: true,
  readingTime: true,
  views: true,
  published: true,
  publishedAt: true,
  metaKeywords: true,
  canonicalUrl: true,
  noIndex: true,
  tldr: true,
  author: { select: { id: true, name: true, avatar: true } },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      description: true,
      descriptionHtml: true,
      descriptionJson: true,
    },
  },
  tags: { select: { id: true, name: true, slug: true } },
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.BlogPostSelect;

/** Shared select for public comment reads. */
const PUBLIC_COMMENT_SELECT = {
  id: true,
  postId: true,
  parentId: true,
  content: true,
  isApproved: true,
  createdAt: true,
  user: { select: { id: true, name: true, avatar: true } },
} as const satisfies Prisma.BlogCommentSelect;

/** Cursor-paginated list of published posts. */
export async function listPublishedPosts(input: {
  cursor?: string;
  limit: number;
  category?: string;
  tag?: string;
  search?: string;
}) {
  const where: Prisma.BlogPostWhereInput = {
    published: true,
    deletedAt: null,
    ...(input.category ? { category: { slug: input.category } } : {}),
    ...(input.tag ? { tags: { some: { slug: input.tag } } } : {}),
    ...(input.search
      ? {
          OR: [
            { title: { contains: input.search, mode: "insensitive" } },
            { excerpt: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await prisma.blogPost.findMany({
    where,
    select: PUBLIC_POST_SELECT,
    orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/** Loads a published post by slug. */
export async function findPublishedPostBySlug(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, published: true, deletedAt: null },
    select: PUBLIC_POST_SELECT,
  });
}

/** Loads a post by id, ignoring publish state (admin surface). */
export async function findPostById(id: string) {
  return prisma.blogPost.findFirst({
    where: { id, deletedAt: null },
    select: PUBLIC_POST_SELECT,
  });
}

/** Returns true when the post slug is taken. */
export async function postSlugExists(slug: string): Promise<boolean> {
  const found = await prisma.blogPost.findUnique({
    where: { slug },
    select: { id: true },
  });
  return found !== null;
}

/** Loads a post's minimal fields for ownership/verification. */
export async function findPostHeaderById(id: string) {
  return prisma.blogPost.findFirst({
    where: { id },
    select: { id: true, authorId: true, published: true, deletedAt: true },
  });
}

/** Creates a blog post row. Caller supplies the resolved slug. */
export async function createBlogPost(
  data: Prisma.BlogPostUncheckedCreateInput,
) {
  return prisma.blogPost.create({
    data,
    select: PUBLIC_POST_SELECT,
  });
}

/** Applies a partial update to a post. */
export async function updateBlogPost(
  id: string,
  data: Prisma.BlogPostUncheckedUpdateInput,
) {
  return prisma.blogPost.update({
    where: { id },
    data,
    select: PUBLIC_POST_SELECT,
  });
}

/** Marks a post as soft-deleted. */
export async function softDeletePost(id: string): Promise<void> {
  await prisma.blogPost.update({
    where: { id },
    data: { deletedAt: new Date(), published: false, publishedAt: null },
  });
}

/**
 * Fetches the tag ids for the given slugs, creating any missing tags.
 *
 * Why:
 * Post authors send tag names; turning that into a `connect` list requires
 * upserting each tag first. Running this in a single transaction keeps a
 * partially-created tag set from being visible if a later step fails.
 */
export async function upsertTagsBySlugs(
  tags: Array<{ name: string; slug: string }>,
) {
  if (tags.length === 0) return [] as Array<{ id: string }>;

  return prisma.$transaction(
    tags.map((tag) =>
      prisma.blogTag.upsert({
        where: { slug: tag.slug },
        update: { name: tag.name },
        create: { name: tag.name, slug: tag.slug },
        select: { id: true },
      }),
    ),
  );
}

/** Fire-and-forget view counter. */
export async function incrementPostViews(id: string): Promise<void> {
  await prisma.blogPost.update({
    where: { id },
    data: { views: { increment: 1 } },
  });
}

/** Cursor-paginated list of approved comments for a post. */
export async function listApprovedComments(
  postId: string,
  input: { cursor?: string; limit: number },
) {
  const rows = await prisma.blogComment.findMany({
    where: { postId, isApproved: true },
    select: PUBLIC_COMMENT_SELECT,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/** Loads a comment by id with the postId for ownership checks. */
export async function findCommentById(id: string) {
  return prisma.blogComment.findUnique({
    where: { id },
    select: {
      id: true,
      postId: true,
      userId: true,
      parentId: true,
      content: true,
      isApproved: true,
    },
  });
}

/** Loads a comment for the public response. */
export async function loadPublicComment(id: string) {
  return prisma.blogComment.findUnique({
    where: { id },
    select: PUBLIC_COMMENT_SELECT,
  });
}

/** Confirms a parent comment exists on the given post and is top-level. */
export async function findTopLevelParent(parentId: string, postId: string) {
  return prisma.blogComment.findFirst({
    where: { id: parentId, postId, parentId: null },
    select: { id: true },
  });
}

/** Persists a new comment row. */
export async function createBlogComment(data: {
  postId: string;
  userId: string;
  content: string;
  parentId: string | null;
}) {
  return prisma.blogComment.create({
    data,
    select: PUBLIC_COMMENT_SELECT,
  });
}

/** Applies a partial update to a comment. */
export async function updateBlogComment(
  id: string,
  data: Prisma.BlogCommentUncheckedUpdateInput,
) {
  return prisma.blogComment.update({
    where: { id },
    data,
    select: PUBLIC_COMMENT_SELECT,
  });
}

/** Deletes a comment. */
export async function deleteBlogComment(id: string): Promise<void> {
  await prisma.blogComment.delete({ where: { id } });
}

// ---------- Categories ----------

export async function listCategories(input: {
  cursor?: string;
  limit: number;
}) {
  const rows = await prisma.blogCategory.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      description: true,
      descriptionHtml: true,
      descriptionJson: true,
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

export async function categorySlugExists(slug: string): Promise<boolean> {
  const row = await prisma.blogCategory.findUnique({
    where: { slug },
    select: { id: true },
  });
  return row !== null;
}

export async function categoryExistsById(id: string): Promise<boolean> {
  const row = await prisma.blogCategory.findUnique({
    where: { id },
    select: { id: true },
  });
  return row !== null;
}

export async function createCategory(data: {
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  descriptionHtml: string | null;
  descriptionJson: string | null;
}) {
  return prisma.blogCategory.create({
    data,
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      description: true,
      descriptionHtml: true,
      descriptionJson: true,
    },
  });
}

// ---------- Tags ----------

export async function listTags(input: { cursor?: string; limit: number }) {
  const rows = await prisma.blogTag.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}
