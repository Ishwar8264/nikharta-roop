/**
 * Purpose: Blog error normalization.
 * Responsibility: Convert expected and unexpected failures into stable API responses.
 * Important Notes: Unique slug conflicts are returned as user-safe conflict errors.
 */
import { Prisma } from "@prisma/client";

import { BLOG_CODES, BLOG_MESSAGES } from "@/features/blogs/constants/blog.constants";
import { blogError } from "@/features/blogs/responses/blog.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { BlogVisibleError } from "./blog.shared";

/**
 * Converts expected and unexpected blog failures into user-safe responses.
 */
export function handleBlogError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof BlogVisibleError) {
    return blogError({ code: error.code, message: error.message, status: error.status });
  }
  if (isUniqueConstraintError(error)) {
    return blogError({
      code: BLOG_CODES.SLUG_DUPLICATE,
      message: BLOG_MESSAGES.SLUG_DUPLICATE,
      status: HTTP_STATUS.CONFLICT,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return blogError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Detects Prisma unique constraint failures for blog slugs.
 */
function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}
