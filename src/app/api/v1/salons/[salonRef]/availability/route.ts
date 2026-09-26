import { NextResponse } from "next/server";

import {
  AppointmentServiceMismatchError,
  AppointmentServiceUnavailableError,
  AppointmentStaffSkillMismatchError,
} from "@/server/modules/appointment/appointment.errors";
import { availabilityQuerySchema } from "@/server/modules/appointment/appointment.schema";
import { getAvailability } from "@/server/modules/appointment/appointment.service";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { salonRefParamSchema } from "@/server/modules/salon/salon.schema";

/** Public availability lookup — bookable slots for a staff member on a day. */
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
  const queryValidation = availabilityQuerySchema.safeParse(
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
    const result = await getAvailability(
      paramValidation.data.salonRef,
      queryValidation.data,
    );

    return NextResponse.json(
      { message: "Availability retrieved", data: result },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (
      error instanceof AppointmentServiceMismatchError ||
      error instanceof AppointmentServiceUnavailableError ||
      error instanceof AppointmentStaffSkillMismatchError
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("Availability lookup failed", error);
    return NextResponse.json(
      { message: "Unable to compute availability" },
      { status: 500 },
    );
  }
}
