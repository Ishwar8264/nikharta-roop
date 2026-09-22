import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { ServiceCategorySlugConflictError } from "@/server/modules/service/service.errors";
import {
  createCategorySchema,
  listCategoriesQuerySchema,
} from "@/server/modules/service/service.schema";
import {
  createServiceCategory,
  listServiceCategories,
} from "@/server/modules/service/service.service";

/**
 * Lists global service categories.
 *
 * Why:
 * Public endpoint — categories are platform-wide vocabulary and are useful
 * for filters before a visitor signs in.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rawQuery = Object.fromEntries(url.searchParams.entries());

  const validation = listCategoriesQuerySchema.safeParse(rawQuery);

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
    const result = await listServiceCategories(validation.data);

    return NextResponse.json(
      {
        message: "Service categories retrieved",
        data: result.items,
        meta: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Category listing failed", error);
    return NextResponse.json(
      { message: "Unable to list service categories" },
      { status: 500 },
    );
  }
}

/**
 * Creates a global service category. SUPER_ADMIN only.
 *
 * Why:
 * The proxy only routes `/api/v1/admin/*` to SUPER_ADMIN checks, so the
 * role gate for this non-admin-prefixed endpoint lives here explicitly.
 */
export async function POST(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  if (auth.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { message: "You do not have permission to access this resource" },
      { status: 403 },
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
    const category = await createServiceCategory(validation.data);

    return NextResponse.json(
      { message: "Category created", data: { category } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ServiceCategorySlugConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("Category creation failed", error);
    return NextResponse.json(
      { message: "Unable to create category" },
      { status: 500 },
    );
  }
}
