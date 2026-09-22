import { NextResponse } from "next/server";

import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { ServiceNotFoundError } from "@/server/modules/service/service.errors";
import { serviceStaffParamSchema } from "@/server/modules/staff/staff.schema";
import { listStaffForSalonService } from "@/server/modules/staff/staff.service";

/**
 * Public list of staff who can perform a given service.
 *
 * Why:
 * Powers the "choose your stylist" step of the booking flow. No
 * authentication — anonymous visitors must be able to see who is available
 * before they sign up.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ salonRef: string; serviceRef: string }> },
): Promise<Response> {
  const params = await context.params;
  const validation = serviceStaffParamSchema.safeParse(params);
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
    const staff = await listStaffForSalonService(
      validation.data.salonRef,
      validation.data.serviceRef,
    );

    return NextResponse.json(
      { message: "Staff retrieved", data: staff },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof ServiceNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error("Service staff listing failed", error);
    return NextResponse.json(
      { message: "Unable to list staff" },
      { status: 500 },
    );
  }
}
