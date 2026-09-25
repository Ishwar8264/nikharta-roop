import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  BlogCategoryNotFoundError,
  BlogPostAccessDeniedError,
  BlogPostNotFoundError,
  BlogPostSlugConflictError,
} from "@/server/modules/blog/blog.errors";
import {
  postIdParamSchema,
  postSlugParamSchema,
  updateBlogPostSchema,
} from "@/server/modules/blog/blog.schema";
import {
  getPostBySlug,
  patchPost,
  removePost,
} from "@/server/modules/blog/blog.service";
import { isResourceId } from "@/server/modules/salon/salon.helpers";

/**
 * Public detail by slug.
 *
 * Why:
 * Id-shaped references are rejected so callers cannot probe the internal id
 * space through the slug lookup path. Only published posts are returned.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ postRef: string }> },
): Promise<Response> {
  const params = await context.params;

  if (isResourceId(params.postRef)) {
    return NextResponse.json(
      { message: "Blog post not found" },
      { status: 404 },
    );
  }

  const validation = postSlugParamSchema.safeParse(params);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const post = await getPostBySlug(validation.data.postRef);
    return NextResponse.json(
      { message: "Post retrieved", data: { post } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof BlogPostNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Blog detail failed", error);
    return NextResponse.json(
      { message: "Unable to retrieve blog post" },
      { status: 500 },
    );
  }
}

/** Partial update. SUPER_ADMIN only. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ postRef: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  if (!isResourceId(params.postRef)) {
    return NextResponse.json(
      { message: "Post ID must be a valid identifier" },
      { status: 400 },
    );
  }

  const paramValidation = postIdParamSchema.safeParse(params);
  if (!paramValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: paramValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const bodyValidation = updateBlogPostSchema.safeParse(body);
  if (!bodyValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: bodyValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const post = await patchPost(
      auth.role,
      paramValidation.data.postRef,
      bodyValidation.data,
    );
    return NextResponse.json(
      { message: "Post updated", data: { post } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof BlogPostAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof BlogCategoryNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof BlogPostNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof BlogPostSlugConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error("Blog update failed", error);
    return NextResponse.json(
      { message: "Unable to update blog post" },
      { status: 500 },
    );
  }
}

/** Soft delete. SUPER_ADMIN only. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ postRef: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  if (!isResourceId(params.postRef)) {
    return NextResponse.json(
      { message: "Post ID must be a valid identifier" },
      { status: 400 },
    );
  }

  const paramValidation = postIdParamSchema.safeParse(params);
  if (!paramValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: paramValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    await removePost(auth.role, paramValidation.data.postRef);
    return NextResponse.json(
      { message: "Post deleted", data: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof BlogPostAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof BlogPostNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Blog delete failed", error);
    return NextResponse.json(
      { message: "Unable to delete blog post" },
      { status: 500 },
    );
  }
}
