import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  ProductCategoryNotFoundError,
  ProductNotFoundError,
  ProductSlugConflictError,
} from "@/server/modules/product/product.errors";
import {
  productParamSchema,
  updateProductSchema,
} from "@/server/modules/product/product.schema";
import {
  deleteSalonProduct,
  getSalonProduct,
  updateSalonProduct,
} from "@/server/modules/product/product.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { isResourceId } from "@/server/modules/salon/salon.helpers";

/**
 * Public detail lookup by slug.
 *
 * Why:
 * Id-shaped references are rejected so callers cannot probe the internal id
 * space through the slug lookup path.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ salonRef: string; productRef: string }> },
): Promise<Response> {
  const params = await context.params;
  const validation = productParamSchema.safeParse(params);

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

  if (isResourceId(validation.data.productRef)) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  try {
    const product = await getSalonProduct(
      validation.data.salonRef,
      validation.data.productRef,
    );

    return NextResponse.json(
      { message: "Product retrieved", data: { product } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof ProductNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error("Product lookup failed", error);
    return NextResponse.json(
      { message: "Unable to retrieve product" },
      { status: 500 },
    );
  }
}

/** Partial update. Requires MANAGER on the parent salon. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ salonRef: string; productRef: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = productParamSchema.safeParse(params);

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

  if (!isResourceId(paramValidation.data.productRef)) {
    return NextResponse.json(
      { message: "Product ID must be a valid identifier" },
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

  const bodyValidation = updateProductSchema.safeParse(body);

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
    const product = await updateSalonProduct(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.productRef,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Product updated", data: { product } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof ProductNotFoundError) {
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

    console.error("Product update failed", error);
    return NextResponse.json(
      { message: "Unable to update product" },
      { status: 500 },
    );
  }
}

/** Soft-deletes a product. Requires MANAGER on the parent salon. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ salonRef: string; productRef: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = productParamSchema.safeParse(params);

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

  if (!isResourceId(paramValidation.data.productRef)) {
    return NextResponse.json(
      { message: "Product ID must be a valid identifier" },
      { status: 400 },
    );
  }

  try {
    await deleteSalonProduct(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.productRef,
    );

    return NextResponse.json(
      { message: "Product deleted", data: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof ProductNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error("Product deletion failed", error);
    return NextResponse.json(
      { message: "Unable to delete product" },
      { status: 500 },
    );
  }
}
