import { BlogPostStatus } from "@prisma/client";

import { getDb } from "@/db";
import { BLOG_CODES, BLOG_MESSAGES } from "@/features/blogs/constants/blog.constants";
import { toPublicBlogPost } from "@/features/blogs/helpers/blog.mapper";
import { blogPostSelect } from "@/features/blogs/helpers/blog.selectors";
import { blogJson } from "@/features/blogs/responses/blog.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  createBlogPostSchema,
  updateBlogPostSchema,
  type CreateBlogPostInput,
  type UpdateBlogPostInput,
} from "@/schema/blogs/schema.blog";
import { handleBlogError } from "./blog.errors";
import { assertActiveBlogCategory, assertBlogPostExists } from "./blog.guards";
import { parseBlogBody, requireBlogAdmin, type BlogAdminUser } from "./blog.shared";

/**
 * Handles admin blog post creation requests.
 */
export async function handleCreateBlogPost(request: Request) {
  const auth = await requireBlogAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseBlogBody(request, createBlogPostSchema);
  if (body.error) return body.error;
  return createBlogPost(body.data, auth.session.user);
}

/**
 * Handles admin blog post patch requests.
 */
export async function handleUpdateBlogPost(request: Request, blogId: string) {
  const auth = await requireBlogAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseBlogBody(request, updateBlogPostSchema);
  if (body.error) return body.error;
  return updateBlogPost(blogId, body.data);
}

/**
 * Creates one blog post with the current admin as author.
 */
async function createBlogPost(input: CreateBlogPostInput, admin: BlogAdminUser) {
  try {
    await assertActiveBlogCategory(input.categoryId);
    const post = await getDb().blogPost.create({
      data: { ...input, authorId: admin.id, publishedAt: publishedAtFor(input) },
      select: blogPostSelect(),
    });
    return blogJson({
      code: BLOG_CODES.BLOG_CREATED,
      data: { blog: toPublicBlogPost(post) },
      message: BLOG_MESSAGES.BLOG_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handleBlogError(error, {
      code: BLOG_CODES.BLOG_CREATE_FAILED,
      handler: "createBlogPost",
      message: BLOG_MESSAGES.BLOG_CREATE_FAILED,
    });
  }
}

/**
 * Updates one blog post after validating category changes.
 */
async function updateBlogPost(blogId: string, input: UpdateBlogPostInput) {
  try {
    await assertBlogPostExists(blogId);
    if (input.categoryId) await assertActiveBlogCategory(input.categoryId);
    const post = await getDb().blogPost.update({
      data: { ...input, publishedAt: publishedAtFor(input) },
      select: blogPostSelect(),
      where: { id: blogId },
    });
    return blogJson({
      code: BLOG_CODES.BLOG_UPDATED,
      data: { blog: toPublicBlogPost(post) },
      message: BLOG_MESSAGES.BLOG_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleBlogError(error, {
      code: BLOG_CODES.BLOG_UPDATE_FAILED,
      handler: "updateBlogPost",
      message: BLOG_MESSAGES.BLOG_UPDATE_FAILED,
    });
  }
}

/**
 * Auto-stamps first publish time when a post becomes published.
 */
function publishedAtFor(input: { publishedAt?: Date | null; status?: BlogPostStatus }) {
  if (input.publishedAt !== undefined) return input.publishedAt;
  return input.status === BlogPostStatus.PUBLISHED ? new Date() : undefined;
}
