import { z } from "zod";

import { resourceIdSchema } from "@/server/modules/salon/salon.schema";

const slugSchema = z
  .string({ error: "Slug must be a string" })
  .trim()
  .min(2, "Slug must contain at least 2 characters")
  .max(120, "Slug must contain at most 120 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens",
  );

const optionalUrlSchema = z
  .string({ error: "URL must be a string" })
  .trim()
  .url("URL is invalid")
  .max(2048, "URL is too long");

/**
 * Public list query for published blog posts.
 *
 * Why:
 * Only published posts are listable. Filters cover the two real discovery
 * paths — category browsing and tag following — plus a title/excerpt search.
 */
export const listBlogPostsQuerySchema = z.strictObject({
  cursor: z
    .string({ error: "Cursor must be a string" })
    .pipe(resourceIdSchema)
    .optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit must be at most 50")
    .default(20),
  category: z
    .string({ error: "Category slug must be a string" })
    .trim()
    .min(1, "Category slug must not be empty")
    .max(120, "Category slug is too long")
    .optional(),
  tag: z
    .string({ error: "Tag slug must be a string" })
    .trim()
    .min(1, "Tag slug must not be empty")
    .max(120, "Tag slug is too long")
    .optional(),
  search: z
    .string({ error: "Search must be a string" })
    .trim()
    .min(2, "Search must contain at least 2 characters")
    .max(80, "Search must contain at most 80 characters")
    .optional(),
});

/**
 * Create a blog post. Always persisted as a draft.
 *
 * Why:
 * `published` is not accepted here on purpose — publishing is a separate,
 * auditable action. This prevents an accidental publish and keeps the
 * lifecycle unambiguous.
 */
export const createBlogPostSchema = z.strictObject({
  title: z
    .string({ error: "Title must be a string" })
    .trim()
    .min(3, "Title must contain at least 3 characters")
    .max(200, "Title must contain at most 200 characters"),
  slug: slugSchema.optional(),
  excerpt: z
    .string({ error: "Excerpt must be a string" })
    .trim()
    .max(500, "Excerpt must contain at most 500 characters")
    .optional(),
  content: z
    .string({ error: "Content must be a string" })
    .min(1, "Content is required")
    .max(200_000, "Content is too long"),
  contentHtml: z.string({ error: "HTML content must be a string" }).optional(),
  contentJson: z.string({ error: "JSON content must be a string" }).optional(),
  coverImage: optionalUrlSchema.optional(),
  categoryId: resourceIdSchema.optional(),
  /**
   * Tag names. Server slugifies, upserts each into BlogTag, and connects.
   * Sending names (rather than ids) keeps the editor simple.
   */
  tags: z
    .array(
      z
        .string({ error: "Tag must be a string" })
        .trim()
        .min(1, "Tag must not be empty")
        .max(60, "Tag must contain at most 60 characters"),
      { error: "Tags must be an array of names" },
    )
    .max(20, "At most 20 tags are allowed")
    .default([]),
  seoTitle: z
    .string({ error: "SEO title must be a string" })
    .trim()
    .max(70, "SEO title must contain at most 70 characters")
    .optional(),
  seoDescription: z
    .string({ error: "SEO description must be a string" })
    .trim()
    .max(160, "SEO description must contain at most 160 characters")
    .optional(),
  metaKeywords: z
    .string({ error: "Meta keywords must be a string" })
    .trim()
    .max(255, "Meta keywords must contain at most 255 characters")
    .optional(),
  canonicalUrl: optionalUrlSchema.optional(),
  noIndex: z.boolean({ error: "noIndex must be a boolean" }).default(false),
  tldr: z
    .string({ error: "TL;DR must be a string" })
    .trim()
    .max(500, "TL;DR must contain at most 500 characters")
    .optional(),
});

/** Partial update — every field optional, at least one required. */
export const updateBlogPostSchema = createBlogPostSchema
  .partial()
  .extend({
    // Nullable on PATCH so a value can be cleared explicitly.
    excerpt: createBlogPostSchema.shape.excerpt.nullable(),
    contentHtml: createBlogPostSchema.shape.contentHtml.nullable(),
    contentJson: createBlogPostSchema.shape.contentJson.nullable(),
    coverImage: createBlogPostSchema.shape.coverImage.nullable(),
    categoryId: createBlogPostSchema.shape.categoryId.nullable(),
    seoTitle: createBlogPostSchema.shape.seoTitle.nullable(),
    seoDescription: createBlogPostSchema.shape.seoDescription.nullable(),
    metaKeywords: createBlogPostSchema.shape.metaKeywords.nullable(),
    canonicalUrl: createBlogPostSchema.shape.canonicalUrl.nullable(),
    tldr: createBlogPostSchema.shape.tldr.nullable(),
    tags: createBlogPostSchema.shape.tags.removeDefault().optional(),
    noIndex: createBlogPostSchema.shape.noIndex.removeDefault().optional(),
  })
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    { message: "At least one field must be provided" },
  );

/**
 * Publish toggle.
 *
 * Why:
 * One endpoint flips either direction. `publish: true` stamps `publishedAt`;
 * `publish: false` clears it. Idempotent — setting the same state is a no-op.
 */
export const publishBlogPostSchema = z.strictObject({
  publish: z.boolean({ error: "publish must be a boolean" }),
});

/** Create a comment or reply. */
export const createBlogCommentSchema = z.strictObject({
  content: z
    .string({ error: "Content must be a string" })
    .trim()
    .min(2, "Comment must contain at least 2 characters")
    .max(2000, "Comment must contain at most 2000 characters"),
  parentId: resourceIdSchema.optional(),
});

/**
 * Update a comment.
 *
 * Why:
 * Authors may edit their own content. Super admins may additionally flip
 * `isApproved` to hide or unhide a comment without deleting it. The refine
 * ensures at least one mutation is requested.
 */
export const updateBlogCommentSchema = z
  .strictObject({
    content: z
      .string({ error: "Content must be a string" })
      .trim()
      .min(2, "Comment must contain at least 2 characters")
      .max(2000, "Comment must contain at most 2000 characters")
      .optional(),
    isApproved: z.boolean({ error: "isApproved must be a boolean" }).optional(),
  })
  .refine(
    (input) => input.content !== undefined || input.isApproved !== undefined,
    { message: "At least one field must be provided" },
  );

/** Public list of comments for a post. */
export const listCommentsQuerySchema = z.strictObject({
  cursor: z
    .string({ error: "Cursor must be a string" })
    .pipe(resourceIdSchema)
    .optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit must be at most 50")
    .default(20),
});

/** Admin create category. */
export const createCategorySchema = z.strictObject({
  name: z
    .string({ error: "Name must be a string" })
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(80, "Name must contain at most 80 characters"),
  slug: slugSchema.optional(),
  description: z
    .string({ error: "Description must be a string" })
    .trim()
    .max(500, "Description must contain at most 500 characters")
    .optional(),
  seoTitle: z
    .string({ error: "SEO title must be a string" })
    .trim()
    .max(70, "SEO title must contain at most 70 characters")
    .optional(),
  seoDescription: z
    .string({ error: "SEO description must be a string" })
    .trim()
    .max(160, "SEO description must contain at most 160 characters")
    .optional(),
});

/** Public list of categories. */
export const listCategoriesQuerySchema = z.strictObject({
  cursor: z
    .string({ error: "Cursor must be a string" })
    .pipe(resourceIdSchema)
    .optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be at most 100")
    .default(50),
});

/** Public list of tags. */
export const listTagsQuerySchema = z.strictObject({
  cursor: z
    .string({ error: "Cursor must be a string" })
    .pipe(resourceIdSchema)
    .optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be at most 100")
    .default(50),
});

/** URL params for post write routes (id-based). */
export const postIdParamSchema = z.strictObject({
  postRef: resourceIdSchema,
});

/** URL params for post read routes (slug-based). */
export const postSlugParamSchema = z.strictObject({
  postRef: z
    .string({ error: "Post reference must be a string" })
    .trim()
    .min(2, "Post reference must contain at least 2 characters")
    .max(120, "Post reference is too long"),
});

/** URL params for the comment detail routes. */
export const commentIdParamSchema = z.strictObject({
  commentId: resourceIdSchema,
});
