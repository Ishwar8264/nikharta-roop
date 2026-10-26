import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/security/request-context";
import {
  SalonPublicationBlockedError,
  SalonPlaceConflictError,
  SalonNotFoundError,
  SalonRoleInsufficientError,
  SlugConflictError,
} from "@/server/modules/salon/salon.errors";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import {
  salonRefParamSchema,
  updateSalonStatusSchema,
} from "@nikharta-roop/shared/schemas/salon";
import {
  updateSalon,
} from "@/server/modules/salon/salon.service";

/** Updates publication after creation. Requires salon MANAGER access. */
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

  const bodyValidation = updateSalonStatusSchema.safeParse(body);

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
      { message: "Salon status updated", data: { salon } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonPublicationBlockedError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
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
