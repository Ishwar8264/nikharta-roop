import "server-only";

import { generateUniqueSlug, slugify } from "@/lib/slug";
import { writeAuditLog } from "@/server/modules/audit/audit.writer";

import {
  BlogCategoryNotFoundError,
  BlogCategorySlugConflictError,
  BlogCommentAccessDeniedError,
  BlogCommentNotFoundError,
  BlogCommentParentInvalidError,
  BlogPostAccessDeniedError,
  BlogPostNotFoundError,
  BlogPostSlugConflictError,
} from "./blog.errors";
import { toPublicBlogPost, toPublicComment } from "./blog.mapper";
import {
  categoryExistsById,
  categorySlugExists,
  createBlogComment,
  createBlogPost,
  createCategory,
  deleteBlogComment,
  findCommentById,
  findPostById,
  findPostHeaderById,
  findPublishedPostBySlug,
  findTopLevelParent,
  incrementPostViews,
  listApprovedComments,
  listCategories,
  listPublishedPosts,
  listTags,
  postSlugExists,
  softDeletePost,
  updateBlogComment,
  updateBlogPost,
  upsertTagsBySlugs,
} from "./blog.repository";
import type {
  CreateBlogCommentInput,
  CreateBlogPostInput,
  CreateCategoryInput,
  ListBlogPostsQuery,
  ListCategoriesQuery,
  ListCommentsQuery,
  ListTagsQuery,
  PaginatedBlogPosts,
  PaginatedCategories,
  PaginatedComments,
  PaginatedTags,
  PublicBlogPost,
  PublicCategory,
  PublicComment,
  PublishBlogPostInput,
  UpdateBlogCommentInput,
  UpdateBlogPostInput,
} from "./blog.types";

/** Roles allowed to manage blog posts. */
const POST_MANAGER_ROLES = new Set(["SUPER_ADMIN"]);

/**
 * Computes reading time from raw content.
 *
 * Why:
 * ~200 words per minute is the standard reading rate. A floor of 1 minute
 * keeps very short posts from reporting "0 min read".
 */
function computeReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Rejects callers that are not allowed to manage posts. */
function assertCanManagePosts(role: string): void {
  if (!POST_MANAGER_ROLES.has(role)) {
    throw new BlogPostAccessDeniedError();
  }
}

/** Public list of published blog posts. */
export async function listPosts(
  query: ListBlogPostsQuery,
): Promise<PaginatedBlogPosts> {
  const result = await listPublishedPosts(query);
  return {
    items: result.items.map(toPublicBlogPost),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/**
 * Public detail by slug. Increments the view counter fire-and-forget.
 */
export async function getPostBySlug(slug: string): Promise<PublicBlogPost> {
  const post = await findPublishedPostBySlug(slug);
  if (!post) throw new BlogPostNotFoundError();

  incrementPostViews(post.id).catch((error) => {
    console.error("View increment failed", post.id, error);
  });

  return toPublicBlogPost(post);
}

/**
 * Creates a post as a draft. SUPER_ADMIN only.
 *
 * Why:
 * `published` is intentionally not settable here — the publish action is a
 * separate endpoint with its own timestamp logic. Tags are auto-upserted
 * so the author never has to pre-create them.
 */
export async function createDraftPost(
  callerId: string,
  callerRole: string,
  input: CreateBlogPostInput,
): Promise<PublicBlogPost> {
  assertCanManagePosts(callerRole);

  if (input.categoryId) {
    const exists = await categoryExistsById(input.categoryId);
    if (!exists) throw new BlogCategoryNotFoundError();
  }

  const slug = input.slug ?? (await generateSlugForPost(input.title));

  if (input.slug) {
    const taken = await postSlugExists(input.slug);
    if (taken) throw new BlogPostSlugConflictError();
  }

  const tagPairs = dedupeTags(input.tags);
  const tagRows = await upsertTagsBySlugs(tagPairs);

  try {
    const created = await createBlogPost({
      title: input.title,
      slug,
      excerpt: input.excerpt ?? null,
      content: input.content,
      contentHtml: input.contentHtml ?? null,
      contentJson: input.contentJson ?? null,
      coverImage: input.coverImage ?? null,
      readingTime: computeReadingTime(input.content),
      published: false,
      publishedAt: null,
      metaKeywords: input.metaKeywords ?? null,
      canonicalUrl: input.canonicalUrl ?? null,
      noIndex: input.noIndex,
      tldr: input.tldr ?? null,
      authorId: callerId,
      categoryId: input.categoryId ?? null,
      tags: { connect: tagRows.map((tag) => ({ id: tag.id })) },
    });

    writeAuditLog({
      userId: callerId,
      action: "CREATE",
      entity: "BlogPost",
      entityId: created.id,
      newData: {
        title: created.title,
        slug: created.slug,
        authorId: callerId,
      },
    });

    return toPublicBlogPost(created);
  } catch (error) {
    if (isUniqueViolation(error, "slug")) throw new BlogPostSlugConflictError();
    throw error;
  }
}

/** Partially updates a post. SUPER_ADMIN only. */
export async function patchPost(
  callerRole: string,
  postId: string,
  input: UpdateBlogPostInput,
): Promise<PublicBlogPost> {
  assertCanManagePosts(callerRole);

  const header = await findPostHeaderById(postId);
  if (!header || header.deletedAt) throw new BlogPostNotFoundError();

  if (input.categoryId) {
    const exists = await categoryExistsById(input.categoryId);
    if (!exists) throw new BlogCategoryNotFoundError();
  }

  if (input.slug !== undefined) {
    const taken = await postSlugExists(input.slug);
    if (taken) {
      const current = await findPostById(postId);
      if (current?.slug !== input.slug) throw new BlogPostSlugConflictError();
    }
  }

  const before = await findPostById(postId);

  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.excerpt !== undefined) data.excerpt = input.excerpt;
  if (input.content !== undefined) {
    data.content = input.content;
    data.readingTime = computeReadingTime(input.content);
  }
  if (input.contentHtml !== undefined) data.contentHtml = input.contentHtml;
  if (input.contentJson !== undefined) data.contentJson = input.contentJson;
  if (input.coverImage !== undefined) data.coverImage = input.coverImage;
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.metaKeywords !== undefined) data.metaKeywords = input.metaKeywords;
  if (input.canonicalUrl !== undefined) data.canonicalUrl = input.canonicalUrl;
  if (input.noIndex !== undefined) data.noIndex = input.noIndex;
  if (input.tldr !== undefined) data.tldr = input.tldr;

  if (input.tags !== undefined) {
    const tagRows = await upsertTagsBySlugs(dedupeTags(input.tags));
    data.tags = { set: tagRows.map((tag) => ({ id: tag.id })) };
  }

  try {
    const updated = await updateBlogPost(postId, data);

    writeAuditLog({
      userId: null,
      action: "UPDATE",
      entity: "BlogPost",
      entityId: postId,
      oldData: before
        ? {
            title: before.title,
            slug: before.slug,
            published: before.published,
          }
        : null,
      newData: {
        title: updated.title,
        slug: updated.slug,
        published: updated.published,
      },
    });

    return toPublicBlogPost(updated);
  } catch (error) {
    if (isUniqueViolation(error, "slug")) throw new BlogPostSlugConflictError();
    throw error;
  }
}

/** Soft-deletes a post. SUPER_ADMIN only. */
export async function removePost(
  callerRole: string,
  postId: string,
): Promise<void> {
  assertCanManagePosts(callerRole);

  const header = await findPostHeaderById(postId);
  if (!header || header.deletedAt) throw new BlogPostNotFoundError();

  await softDeletePost(postId);

  writeAuditLog({
    userId: header.authorId,
    action: "DELETE",
    entity: "BlogPost",
    entityId: postId,
    oldData: { published: header.published },
  });
}

/**
 * Publishes or unpublishes a post. SUPER_ADMIN only.
 *
 * Why:
 * Stamps `publishedAt` on the first publish. Re-publishing after an unpublish
 * overwrites the timestamp so the post appears at the top of the feed again.
 */
export async function togglePublish(
  callerRole: string,
  postId: string,
  input: PublishBlogPostInput,
): Promise<PublicBlogPost> {
  assertCanManagePosts(callerRole);

  const header = await findPostHeaderById(postId);
  if (!header || header.deletedAt) throw new BlogPostNotFoundError();

  const updated = await updateBlogPost(postId, {
    published: input.publish,
    publishedAt: input.publish ? new Date() : null,
  });

  writeAuditLog({
    userId: null,
    action: "UPDATE",
    entity: "BlogPost",
    entityId: postId,
    oldData: { published: header.published },
    newData: { published: input.publish },
  });

  return toPublicBlogPost(updated);
}

/** Public list of approved comments on a post. */
export async function listComments(
  postSlug: string,
  query: ListCommentsQuery,
): Promise<PaginatedComments> {
  const post = await findPublishedPostBySlug(postSlug);
  if (!post) throw new BlogPostNotFoundError();

  const result = await listApprovedComments(post.id, query);
  return {
    items: result.items.map(toPublicComment),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/**
 * Creates a comment on a post. Any authenticated user.
 *
 * Why:
 * The post is addressed by slug because the client is viewing the published
 * article. Replies are one level deep — the parent must be a top-level
 * comment on the same post.
 */
export async function createComment(
  userId: string,
  postSlug: string,
  input: CreateBlogCommentInput,
): Promise<PublicComment> {
  const post = await findPublishedPostBySlug(postSlug);
  if (!post) throw new BlogPostNotFoundError();

  if (input.parentId) {
    const parent = await findTopLevelParent(input.parentId, post.id);
    if (!parent) throw new BlogCommentParentInvalidError();
  }

  const created = await createBlogComment({
    postId: post.id,
    userId,
    content: input.content,
    parentId: input.parentId ?? null,
  });

  writeAuditLog({
    userId,
    action: "CREATE",
    entity: "BlogComment",
    entityId: created.id,
    newData: { postId: post.id, parentId: input.parentId ?? null },
  });

  return toPublicComment(created);
}

/**
 * Updates a comment.
 *
 * Why:
 * The author may edit their own content. A SUPER_ADMIN may flip `isApproved`
 * to hide/unhide. Both permissions are checked together — a caller can only
 * perform the action they are entitled to.
 */
export async function patchComment(
  callerId: string,
  callerRole: string,
  commentId: string,
  input: UpdateBlogCommentInput,
): Promise<PublicComment> {
  const existing = await findCommentById(commentId);
  if (!existing) throw new BlogCommentNotFoundError();

  const isAuthor = existing.userId === callerId;
  const isAdmin = callerRole === "SUPER_ADMIN";

  if (input.content !== undefined && !isAuthor) {
    throw new BlogCommentAccessDeniedError();
  }
  if (input.isApproved !== undefined && !isAdmin) {
    throw new BlogCommentAccessDeniedError();
  }

  const data: Record<string, unknown> = {};
  if (input.content !== undefined) data.content = input.content;
  if (input.isApproved !== undefined) data.isApproved = input.isApproved;

  const updated = await updateBlogComment(commentId, data);

  writeAuditLog({
    userId: callerId,
    action: "UPDATE",
    entity: "BlogComment",
    entityId: commentId,
    oldData: {
      content: existing.content,
      isApproved: existing.isApproved,
    },
    newData: {
      content: input.content,
      isApproved: input.isApproved,
    },
  });

  return toPublicComment(updated);
}

/**
 * Deletes a comment.
 *
 * Why:
 * Authors may remove their own. SUPER_ADMIN may remove any. No soft-delete
 * here because comments are small and the audit trail lives on the post.
 */
export async function removeComment(
  callerId: string,
  callerRole: string,
  commentId: string,
): Promise<void> {
  const existing = await findCommentById(commentId);
  if (!existing) throw new BlogCommentNotFoundError();

  const isAuthor = existing.userId === callerId;
  const isAdmin = callerRole === "SUPER_ADMIN";

  if (!isAuthor && !isAdmin) throw new BlogCommentAccessDeniedError();

  await deleteBlogComment(commentId);

  writeAuditLog({
    userId: callerId,
    action: "DELETE",
    entity: "BlogComment",
    entityId: commentId,
    oldData: { postId: existing.postId },
  });
}

/** Public list of blog categories. */
export async function listBlogCategories(
  query: ListCategoriesQuery,
): Promise<PaginatedCategories> {
  return listCategories(query);
}

/** Create a category. SUPER_ADMIN only. */
export async function createBlogCategory(
  callerRole: string,
  input: CreateCategoryInput,
): Promise<PublicCategory> {
  assertCanManagePosts(callerRole);

  const slug = input.slug ?? slugify(input.name);
  if (input.slug) {
    const taken = await categorySlugExists(input.slug);
    if (taken) throw new BlogCategorySlugConflictError();
  }

  try {
    const created = await createCategory({
      name: input.name,
      slug,
      shortDescription: input.shortDescription ?? null,
      description: input.description ?? null,
      descriptionHtml: input.descriptionHtml ?? null,
      descriptionJson: input.descriptionJson ?? null,
    });

    writeAuditLog({
      userId: null,
      action: "CREATE",
      entity: "BlogCategory",
      entityId: created.id,
      newData: { name: created.name, slug: created.slug },
    });

    return created;
  } catch (error) {
    if (isUniqueViolation(error, "slug")) {
      throw new BlogCategorySlugConflictError();
    }
    throw error;
  }
}

/** Public list of tags. */
export async function listBlogTags(
  query: ListTagsQuery,
): Promise<PaginatedTags> {
  return listTags(query);
}

// ---------- Helpers ----------

/** Generates a unique post slug or throws a typed conflict. */
async function generateSlugForPost(title: string): Promise<string> {
  try {
    return await generateUniqueSlug(slugify(title), postSlugExists);
  } catch {
    throw new BlogPostSlugConflictError();
  }
}

/** Normalizes tag names to unique {name, slug} pairs. */
function dedupeTags(names: string[]): Array<{ name: string; slug: string }> {
  const seen = new Map<string, { name: string; slug: string }>();
  for (const raw of names) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const slug = slugify(trimmed);
    if (!slug) continue;
    if (!seen.has(slug)) seen.set(slug, { name: trimmed, slug });
  }
  return Array.from(seen.values());
}

/** Prisma unique-constraint check scoped to a specific field. */
function isUniqueViolation(error: unknown, field: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002" &&
    (() => {
      const target = (error as { meta?: { target?: unknown } }).meta?.target;
      if (Array.isArray(target)) return target.includes(field);
      if (typeof target === "string") return target.includes(field);
      return true;
    })()
  );
}
