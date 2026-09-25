import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  BlogCategoryNotFoundError,
  BlogPostAccessDeniedError,
  BlogPostSlugConflictError,
} from "@/server/modules/blog/blog.errors";
import {
  createBlogPostSchema,
  listBlogPostsQuerySchema,
} from "@/server/modules/blog/blog.schema";
import { createDraftPost, listPosts } from "@/server/modules/blog/blog.service";

/** Public list of published blog posts. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const validation = listBlogPostsQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
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
    const result = await listPosts(validation.data);
    return NextResponse.json(
      {
        message: "Posts retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Blog listing failed", error);
    return NextResponse.json(
      { message: "Unable to list blog posts" },
      { status: 500 },
    );
  }
}

/** Creates a blog post as a draft. SUPER_ADMIN only. */
export async function POST(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
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

  const validation = createBlogPostSchema.safeParse(body);
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
    const post = await createDraftPost(auth.sub, auth.role, validation.data);
    return NextResponse.json(
      { message: "Draft created", data: { post } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof BlogPostAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof BlogCategoryNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof BlogPostSlugConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error("Blog draft creation failed", error);
    return NextResponse.json(
      { message: "Unable to create blog post" },
      { status: 500 },
    );
  }
}
