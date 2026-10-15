import { Prisma } from "@/generated/prisma/client";
import { updateSalonMemberSchema } from "@/server/modules/salon/salon.schema";
import { updateOwnSalonMemberProfile } from "@/server/modules/salon/salon.service";
import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  LastOwnerRemovalError,
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import { salonMemberParamSchema } from "@/server/modules/salon/salon.schema";
import { removeSalonMemberByOwner } from "@/server/modules/salon/salon.service";

/**
 * Removes a member from a salon. OWNER only.
 *
 * Why:
 * Blocked from removing the last OWNER by the service layer — see
 * `LastOwnerRemovalError` — so a salon can never be orphaned.
 *
 * The salon reference must be the internal id, not the slug, because member
 * management is keyed to the same identifier used elsewhere in the
 * management surface.
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ salonRef: string; memberId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = salonMemberParamSchema.safeParse(params);

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

  // Member management is addressed by the salon id. A slug here means the
  // caller is using the wrong identifier — tell them so instead of pretending
  // the salon does not exist.
  if (!isResourceId(paramValidation.data.salonRef)) {
    return NextResponse.json(
      { message: "Salon ID must be a valid identifier" },
      { status: 400 },
    );
  }

  try {
    await removeSalonMemberByOwner(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.memberId,
    );

    return NextResponse.json(
      { message: "Member removed", data: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    if (error instanceof LastOwnerRemovalError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("Member removal failed", error);
    return NextResponse.json(
      { message: "Unable to remove member" },
      { status: 500 },
    );
  }
}

/** PATCH /salons/:salonId/members/:memberId — authenticated member self-service. */
export async function PATCH(request: Request,
  context: { params: Promise<{ salonRef: string; memberId: string }> }): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  const params = salonMemberParamSchema.safeParse(await context.params);
  if (!params.success || !isResourceId(params.data.salonRef)) {
    return NextResponse.json({ message: "Valid salon and member IDs are required" }, { status: 400 });
  }
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 }); }
  const input = updateSalonMemberSchema.safeParse(body);
  if (!input.success) return NextResponse.json({ message: "Validation failed", errors: input.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })) }, { status: 400 });
  try {
    const member = await updateOwnSalonMemberProfile(auth.sub, params.data.salonRef, params.data.memberId, input.data);
    return NextResponse.json({ message: "Member updated", data: { member } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") return NextResponse.json({ message: "Member not found or not editable by this account" }, { status: 404 });
      if (error.code === "P2002") return NextResponse.json({ message: "This member slug is already in use in this salon" }, { status: 409 });
    }
    console.error("Member update failed", error);
    return NextResponse.json({ message: "Unable to update member" }, { status: 500 });
  }
}
