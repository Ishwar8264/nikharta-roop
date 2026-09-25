import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  BlogPostAccessDeniedError,
  BlogPostNotFoundError,
} from "@/server/modules/blog/blog.errors";
import {
  postIdParamSchema,
  publishBlogPostSchema,
} from "@/server/modules/blog/blog.schema";
import { togglePublish } from "@/server/modules/blog/blog.service";
import { isResourceId } from "@/server/modules/salon/salon.helpers";

/** Publishes or unpublishes a post. SUPER_ADMIN only. */
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

  const bodyValidation = publishBlogPostSchema.safeParse(body);
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
    const post = await togglePublish(
      auth.role,
      paramValidation.data.postRef,
      bodyValidation.data,
    );
    return NextResponse.json(
      {
        message: bodyValidation.data.publish
          ? "Post published"
          : "Post unpublished",
        data: { post },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof BlogPostAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof BlogPostNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Blog publish toggle failed", error);
    return NextResponse.json(
      { message: "Unable to change publish state" },
      { status: 500 },
    );
  }
}
