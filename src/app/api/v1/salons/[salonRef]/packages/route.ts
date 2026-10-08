import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  PackageServiceMismatchError,
  PackageSlugConflictError,
} from "@/server/modules/package/package.errors";
import {
  createPackageSchema,
  listPackagesQuerySchema,
} from "@/server/modules/package/package.schema";
import {
  createSalonPackage,
  listSalonPackageCatalog,
} from "@/server/modules/package/package.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { salonRefParamSchema } from "@/server/modules/salon/salon.schema";

/** Lists a salon's active packages. Public endpoint. */
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
  const queryValidation = listPackagesQuerySchema.safeParse(
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
    const result = await listSalonPackageCatalog(
      paramValidation.data.salonRef,
      queryValidation.data,
    );

    return NextResponse.json(
      {
        message: "Packages retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error("Package listing failed", error);
    return NextResponse.json(
      { message: "Unable to list packages" },
      { status: 500 },
    );
  }
}

/**
 * Creates a package inside a salon the caller manages. MANAGER+.
 *
 * Why:
 * Nested resources inherit authorization from their parent salon, matching
 * the product and service routes.
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

  const bodyValidation = createPackageSchema.safeParse(body);
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
    const created = await createSalonPackage(
      auth.sub,
      paramValidation.data.salonRef,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Package created", data: { package: created } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof PackageSlugConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof PackageServiceMismatchError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("Package creation failed", error);
    return NextResponse.json(
      { message: "Unable to create package" },
      { status: 500 },
    );
  }
}
