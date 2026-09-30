import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  SalonPlaceConflictError,
  SalonNotFoundError,
  SalonRoleInsufficientError,
  SlugConflictError,
} from "@/server/modules/salon/salon.errors";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import {
  salonRefParamSchema,
  updateSalonSchema,
} from "@/server/modules/salon/salon.schema";
import {
  deleteSalon,
  getSalonBySlug,
  updateSalon,
} from "@/server/modules/salon/salon.service";

/**
 * Loads a single salon by slug for the public detail page.
 *
 * Why:
 * Public endpoint. Rejects id-shaped references so callers cannot probe the
 * internal id space through the slug lookup path.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ salonRef: string }> },
): Promise<Response> {
  const params = await context.params;
  const validation = salonRefParamSchema.safeParse(params);

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

  // Public detail lookup is slug-only. Returning 404 for id-shaped input
  // keeps the id space out of the public surface.
  if (isResourceId(validation.data.salonRef)) {
    return NextResponse.json({ message: "Salon not found" }, { status: 404 });
  }

  try {
    const salon = await getSalonBySlug(validation.data.salonRef);

    return NextResponse.json(
      { message: "Salon retrieved", data: { salon } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error("Salon lookup failed", error);
    return NextResponse.json(
      { message: "Unable to retrieve salon" },
      { status: 500 },
    );
  }
}

/**
 * Applies a partial update to a salon.
 *
 * Why:
 * Requires at least MANAGER on the target salon. The service performs the
 * membership check at query time so the authorization decision cannot be
 * bypassed by changing the order of checks.
 */
export async function PATCH(
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

  // Mutations require the internal id — a slug is not accepted here.
  if (!isResourceId(paramValidation.data.salonRef)) {
    return NextResponse.json(
      { message: "Salon ID must be a valid identifier" },
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

  const bodyValidation = updateSalonSchema.safeParse(body);

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
    const salon = await updateSalon(
      auth.sub,
      paramValidation.data.salonRef,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Salon updated", data: { salon } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    if (error instanceof SlugConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    if (error instanceof SalonPlaceConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("Salon update failed", error);
    return NextResponse.json(
      { message: "Unable to update salon" },
      { status: 500 },
    );
  }
}

/**
 * Soft-deletes a salon. Restricted to OWNER.
 *
 * Why:
 * Deletion affects every appointment, service, and product attached to the
 * salon. Only the principal decision-maker for the business can trigger it.
 */
export async function DELETE(
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

  if (!isResourceId(paramValidation.data.salonRef)) {
    return NextResponse.json(
      { message: "Salon ID must be a valid identifier" },
      { status: 400 },
    );
  }

  try {
    await deleteSalon(auth.sub, paramValidation.data.salonRef);

    return NextResponse.json(
      { message: "Salon deleted", data: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error("Salon deletion failed", error);
    return NextResponse.json(
      { message: "Unable to delete salon" },
      { status: 500 },
    );
  }
}
