import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  BlogCommentParentInvalidError,
  BlogPostNotFoundError,
} from "@/server/modules/blog/blog.errors";
import {
  createBlogCommentSchema,
  listCommentsQuerySchema,
  postSlugParamSchema,
} from "@/server/modules/blog/blog.schema";
import {
  createComment,
  listComments,
} from "@/server/modules/blog/blog.service";
import { isResourceId } from "@/server/modules/salon/salon.helpers";

/** Public list of approved comments on a published post. */
export async function GET(
  request: Request,
  context: { params: Promise<{ postRef: string }> },
): Promise<Response> {
  const params = await context.params;

  if (isResourceId(params.postRef)) {
    return NextResponse.json(
      { message: "Blog post not found" },
      { status: 404 },
    );
  }

  const paramValidation = postSlugParamSchema.safeParse(params);
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

  const url = new URL(request.url);
  const queryValidation = listCommentsQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
  if (!queryValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: queryValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const result = await listComments(
      paramValidation.data.postRef,
      queryValidation.data,
    );
    return NextResponse.json(
      {
        message: "Comments retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof BlogPostNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Blog comment listing failed", error);
    return NextResponse.json(
      { message: "Unable to list comments" },
      { status: 500 },
    );
  }
}

/** Creates a comment or reply. Any authenticated user. */
export async function POST(
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

  if (isResourceId(params.postRef)) {
    return NextResponse.json(
      { message: "Blog post not found" },
      { status: 404 },
    );
  }

  const paramValidation = postSlugParamSchema.safeParse(params);
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

  const bodyValidation = createBlogCommentSchema.safeParse(body);
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
    const comment = await createComment(
      auth.sub,
      paramValidation.data.postRef,
      bodyValidation.data,
    );
    return NextResponse.json(
      { message: "Comment added", data: { comment } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof BlogPostNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof BlogCommentParentInvalidError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Blog comment creation failed", error);
    return NextResponse.json(
      { message: "Unable to add comment" },
      { status: 500 },
    );
  }
}
