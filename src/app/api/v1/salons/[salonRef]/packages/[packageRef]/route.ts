import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  PackageNotFoundError,
  PackageServiceMismatchError,
} from "@/server/modules/package/package.errors";
import {
  packageParamSchema,
  updatePackageSchema,
} from "@/server/modules/package/package.schema";
import {
  deleteSalonPackage,
  getPublicPackage,
  updateSalonPackage,
} from "@/server/modules/package/package.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";

/** Loads an active package by slug. Public endpoint. */
export async function GET(
  request: Request,
  context: { params: Promise<{ salonRef: string; packageRef: string }> },
): Promise<Response> {
  const params = await context.params;
  const paramValidation = packageParamSchema.safeParse(params);

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
    const found = await getPublicPackage(
      paramValidation.data.salonRef,
      paramValidation.data.packageRef,
    );

    return NextResponse.json(
      { message: "Package retrieved", data: { package: found } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof PackageNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error("Package detail failed", error);
    return NextResponse.json(
      { message: "Unable to retrieve package" },
      { status: 500 },
    );
  }
}

/** Updates a package by id. MANAGER+. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ salonRef: string; packageRef: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = packageParamSchema.safeParse(params);

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

  const bodyValidation = updatePackageSchema.safeParse(body);
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
    const updated = await updateSalonPackage(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.packageRef,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Package updated", data: { package: updated } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof PackageNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof PackageServiceMismatchError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("Package update failed", error);
    return NextResponse.json(
      { message: "Unable to update package" },
      { status: 500 },
    );
  }
}

/** Soft-deletes a package by id. MANAGER+. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ salonRef: string; packageRef: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = packageParamSchema.safeParse(params);

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
    await deleteSalonPackage(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.packageRef,
    );

    return NextResponse.json(
      { message: "Package deleted", data: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof PackageNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error("Package deletion failed", error);
    return NextResponse.json(
      { message: "Unable to delete package" },
      { status: 500 },
    );
  }
}
