import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  BlogCommentAccessDeniedError,
  BlogCommentNotFoundError,
} from "@/server/modules/blog/blog.errors";
import {
  commentIdParamSchema,
  updateBlogCommentSchema,
} from "@/server/modules/blog/blog.schema";
import {
  patchComment,
  removeComment,
} from "@/server/modules/blog/blog.service";

/** Updates a comment (author) or flips its approval (admin). */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ commentId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = commentIdParamSchema.safeParse(params);
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

  const bodyValidation = updateBlogCommentSchema.safeParse(body);
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
    const comment = await patchComment(
      auth.sub,
      auth.role,
      paramValidation.data.commentId,
      bodyValidation.data,
    );
    return NextResponse.json(
      { message: "Comment updated", data: { comment } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof BlogCommentNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof BlogCommentAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Blog comment update failed", error);
    return NextResponse.json(
      { message: "Unable to update comment" },
      { status: 500 },
    );
  }
}

/** Deletes a comment (author or admin). */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ commentId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = commentIdParamSchema.safeParse(params);
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
    await removeComment(auth.sub, auth.role, paramValidation.data.commentId);
    return NextResponse.json(
      { message: "Comment deleted", data: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof BlogCommentNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof BlogCommentAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Blog comment delete failed", error);
    return NextResponse.json(
      { message: "Unable to delete comment" },
      { status: 500 },
    );
  }
}
