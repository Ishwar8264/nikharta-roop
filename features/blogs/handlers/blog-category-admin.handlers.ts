import { getDb } from "@/db";
import { BLOG_CODES, BLOG_MESSAGES } from "@/features/blogs/constants/blog.constants";
import { toPublicBlogCategory } from "@/features/blogs/helpers/blog.mapper";
import { blogCategorySelect } from "@/features/blogs/helpers/blog.selectors";
import { blogJson } from "@/features/blogs/responses/blog.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  createBlogCategorySchema,
  updateBlogCategorySchema,
  type CreateBlogCategoryInput,
  type UpdateBlogCategoryInput,
} from "@/schema/blogs/schema.blog";
import { handleBlogError } from "./blog.errors";
import { assertBlogCategoryExists } from "./blog.guards";
import { parseBlogBody, requireBlogAdmin } from "./blog.shared";

/**
 * Handles admin blog category creation requests.
 */
export async function handleCreateBlogCategory(request: Request) {
  const auth = await requireBlogAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseBlogBody(request, createBlogCategorySchema);
  if (body.error) return body.error;
  return createBlogCategory(body.data);
}

/**
 * Handles admin blog category patch requests.
 */
export async function handleUpdateBlogCategory(request: Request, categoryId: string) {
  const auth = await requireBlogAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseBlogBody(request, updateBlogCategorySchema);
  if (body.error) return body.error;
  return updateBlogCategory(categoryId, body.data);
}

/**
 * Creates one blog category for published or draft posts.
 */
async function createBlogCategory(input: CreateBlogCategoryInput) {
  try {
    const category = await getDb().blogCategory.create({
      data: input,
      select: blogCategorySelect(),
    });
    return blogJson({
      code: BLOG_CODES.BLOG_CATEGORY_CREATED,
      data: { category: toPublicBlogCategory(category) },
      message: BLOG_MESSAGES.BLOG_CATEGORY_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handleBlogError(error, {
      code: BLOG_CODES.BLOG_CATEGORY_CREATE_FAILED,
      handler: "createBlogCategory",
      message: BLOG_MESSAGES.BLOG_CATEGORY_CREATE_FAILED,
    });
  }
}

/**
 * Updates one blog category after confirming it exists.
 */
async function updateBlogCategory(
  categoryId: string,
  input: UpdateBlogCategoryInput,
) {
  try {
    await assertBlogCategoryExists(categoryId);
    const category = await getDb().blogCategory.update({
      data: input,
      select: blogCategorySelect(),
      where: { id: categoryId },
    });
    return blogJson({
      code: BLOG_CODES.BLOG_CATEGORY_UPDATED,
      data: { category: toPublicBlogCategory(category) },
      message: BLOG_MESSAGES.BLOG_CATEGORY_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleBlogError(error, {
      code: BLOG_CODES.BLOG_CATEGORY_UPDATE_FAILED,
      handler: "updateBlogCategory",
      message: BLOG_MESSAGES.BLOG_CATEGORY_UPDATE_FAILED,
    });
  }
}
