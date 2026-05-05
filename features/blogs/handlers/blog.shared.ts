import type { ZodType } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import { BLOG_CODES, BLOG_MESSAGES } from "@/features/blogs/constants/blog.constants";
import { blogError } from "@/features/blogs/responses/blog.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type BlogAdminUser = {
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach blog management handlers.
 */
export async function requireBlogAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: blogError({
        code: BLOG_CODES.FORBIDDEN,
        message: BLOG_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with blog-owned validation error codes.
 */
export async function parseBlogBody<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: blogError({
        code: BLOG_CODES.VALIDATION_ERROR,
        message: parsed.error.issues[0]?.message ?? BLOG_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data, error: null };
}

/**
 * Carries expected blog errors across helper boundaries.
 */
export class BlogVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
