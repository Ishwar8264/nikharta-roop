import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import {
  StaffNotFoundError,
  StaffRoleInsufficientError,
} from "@/server/modules/staff/staff.errors";
import { staffParamSchema } from "@/server/modules/staff/staff.schema";
import { getStaffDetail } from "@/server/modules/staff/staff.service";

/** Loads a single staff member's public profile. */
export async function GET(
  request: Request,
  context: { params: Promise<{ salonRef: string; staffId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const validation = staffParamSchema.safeParse(params);
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
    const staff = await getStaffDetail(
      auth.sub,
      validation.data.salonRef,
      validation.data.staffId,
    );

    return NextResponse.json(
      { message: "Staff retrieved", data: { staff } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof StaffNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof StaffRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error("Staff detail failed", error);
    return NextResponse.json(
      { message: "Unable to retrieve staff" },
      { status: 500 },
    );
  }
}
