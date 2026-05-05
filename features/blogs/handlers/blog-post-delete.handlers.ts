import { getDb } from "@/db";
import { BLOG_CODES, BLOG_MESSAGES } from "@/features/blogs/constants/blog.constants";
import { blogJson } from "@/features/blogs/responses/blog.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { handleBlogError } from "./blog.errors";
import { assertBlogPostExists } from "./blog.guards";
import { requireBlogAdmin } from "./blog.shared";

/**
 * Handles admin blog post delete requests.
 */
export async function handleDeleteBlogPost(request: Request, blogId: string) {
  const auth = await requireBlogAdmin(request);
  if (!auth.success) return auth.error;
  return deleteBlogPost(blogId);
}

/**
 * Deletes one blog post after confirming it exists.
 */
async function deleteBlogPost(blogId: string) {
  try {
    await assertBlogPostExists(blogId);
    await getDb().blogPost.delete({ where: { id: blogId } });
    return blogJson({
      code: BLOG_CODES.BLOG_DELETED,
      data: { blogId },
      message: BLOG_MESSAGES.BLOG_DELETED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleBlogError(error, {
      code: BLOG_CODES.BLOG_DELETE_FAILED,
      handler: "deleteBlogPost",
      message: BLOG_MESSAGES.BLOG_DELETE_FAILED,
    });
  }
}
