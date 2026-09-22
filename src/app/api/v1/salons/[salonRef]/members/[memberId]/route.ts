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
