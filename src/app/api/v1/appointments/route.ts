import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  AppointmentAccessDeniedError,
  AppointmentOutsideSalonHoursError,
  AppointmentOutsideStaffHoursError,
  AppointmentServiceMismatchError,
  AppointmentServiceUnavailableError,
  AppointmentSlotTakenError,
  AppointmentStaffOnLeaveError,
  AppointmentStaffSkillMismatchError,
  AppointmentStartTimeInPastError,
} from "@/server/modules/appointment/appointment.errors";
import {
  createAppointmentSchema,
  listMyAppointmentsQuerySchema,
} from "@/server/modules/appointment/appointment.schema";
import {
  createAppointment,
  listMyAppointments,
} from "@/server/modules/appointment/appointment.service";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";

/** Lists the authenticated user's own appointments. */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const validation = listMyAppointmentsQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
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
    const result = await listMyAppointments(auth.sub, validation.data);

    return NextResponse.json(
      {
        message: "Appointments retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Appointment listing failed", error);
    return NextResponse.json(
      { message: "Unable to list appointments" },
      { status: 500 },
    );
  }
}

/** Creates an appointment. */
export async function POST(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
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

  const validation = createAppointmentSchema.safeParse(body);
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
    const appointment = await createAppointment(auth.sub, validation.data);

    return NextResponse.json(
      { message: "Appointment created", data: { appointment } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof AppointmentAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof AppointmentStartTimeInPastError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (
      error instanceof AppointmentServiceMismatchError ||
      error instanceof AppointmentServiceUnavailableError ||
      error instanceof AppointmentStaffSkillMismatchError
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (
      error instanceof AppointmentOutsideSalonHoursError ||
      error instanceof AppointmentOutsideStaffHoursError
    ) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof AppointmentStaffOnLeaveError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof AppointmentSlotTakenError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("Appointment creation failed", error);
    return NextResponse.json(
      { message: "Unable to create appointment" },
      { status: 500 },
    );
  }
}
