import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  SalonMemberExistsError,
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import {
  addSalonMemberSchema,
  salonRefParamSchema,
} from "@/server/modules/salon/salon.schema";
import {
  addSalonMemberByOwner,
  getSalonMembers,
} from "@/server/modules/salon/salon.service";

/**
 * Lists the roster of a salon. Managers and up.
 *
 * Why:
 * Members are addressed by the salon's internal id, not its slug, so an
 * id-shaped reference is required. Slug-shaped input gets a 400 rather than a
 * 404 because the client is using the wrong identifier, not a missing one.
 */
export async function GET(
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
    const members = await getSalonMembers(
      auth.sub,
      paramValidation.data.salonRef,
    );

    return NextResponse.json(
      { message: "Members retrieved", data: members },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error("Member listing failed", error);
    return NextResponse.json(
      { message: "Unable to list members" },
      { status: 500 },
    );
  }
}

/** Adds a member to a salon. OWNER only. */
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

  const bodyValidation = addSalonMemberSchema.safeParse(body);

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
    const member = await addSalonMemberByOwner(
      auth.sub,
      paramValidation.data.salonRef,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Member added", data: { member } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    if (error instanceof SalonMemberExistsError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("Member add failed", error);
    return NextResponse.json(
      { message: "Unable to add member" },
      { status: 500 },
    );
  }
}
