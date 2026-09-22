import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  ProductCategoryNotFoundError,
  ProductSlugConflictError,
} from "@/server/modules/product/product.errors";
import {
  createProductSchema,
  listProductsQuerySchema,
} from "@/server/modules/product/product.schema";
import {
  createSalonProduct,
  listSalonProducts,
} from "@/server/modules/product/product.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { salonRefParamSchema } from "@/server/modules/salon/salon.schema";

/**
 * Lists a salon's active products. Public endpoint.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ salonRef: string }> },
): Promise<Response> {
  const params = await context.params;
  const paramValidation = salonRefParamSchema.safeParse(params);

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
  const rawQuery = Object.fromEntries(url.searchParams.entries());

  const queryValidation = listProductsQuerySchema.safeParse(rawQuery);

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
    const result = await listSalonProducts(
      paramValidation.data.salonRef,
      queryValidation.data,
    );

    return NextResponse.json(
      {
        message: "Products retrieved",
        data: result.items,
        meta: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error("Product listing failed", error);
    return NextResponse.json(
      { message: "Unable to list products" },
      { status: 500 },
    );
  }
}

/**
 * Creates a product inside a salon the caller manages.
 *
 * Why:
 * Requires at least MANAGER on the parent salon. Nested resources inherit
 * authorization from their parent.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ salonRef: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = salonRefParamSchema.safeParse(params);

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

  const bodyValidation = createProductSchema.safeParse(body);

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
    const product = await createSalonProduct(
      auth.sub,
      paramValidation.data.salonRef,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Product created", data: { product } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    if (error instanceof ProductCategoryNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof ProductSlugConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("Product creation failed", error);
    return NextResponse.json(
      { message: "Unable to create product" },
      { status: 500 },
    );
  }
}
