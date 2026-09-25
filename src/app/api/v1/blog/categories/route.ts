import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  BlogCategorySlugConflictError,
  BlogPostAccessDeniedError,
} from "@/server/modules/blog/blog.errors";
import {
  createCategorySchema,
  listCategoriesQuerySchema,
} from "@/server/modules/blog/blog.schema";
import {
  createBlogCategory,
  listBlogCategories,
} from "@/server/modules/blog/blog.service";

/** Public list of blog categories. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const validation = listCategoriesQuerySchema.safeParse(
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
    const result = await listBlogCategories(validation.data);
    return NextResponse.json(
      {
        message: "Categories retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Category listing failed", error);
    return NextResponse.json(
      { message: "Unable to list categories" },
      { status: 500 },
    );
  }
}

/** Creates a blog category. SUPER_ADMIN only. */
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

  const validation = createCategorySchema.safeParse(body);
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
    const category = await createBlogCategory(auth.role, validation.data);
    return NextResponse.json(
      { message: "Category created", data: { category } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof BlogPostAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof BlogCategorySlugConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error("Category creation failed", error);
    return NextResponse.json(
      { message: "Unable to create category" },
      { status: 500 },
    );
  }
}
