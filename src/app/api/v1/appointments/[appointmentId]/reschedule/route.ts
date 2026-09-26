import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  AppointmentAccessDeniedError,
  AppointmentNotFoundError,
  AppointmentOutsideSalonHoursError,
  AppointmentOutsideStaffHoursError,
  AppointmentSlotTakenError,
  AppointmentStaffOnLeaveError,
  AppointmentStartTimeInPastError,
  AppointmentTerminalStateError,
} from "@/server/modules/appointment/appointment.errors";
import {
  appointmentParamSchema,
  rescheduleAppointmentSchema,
} from "@/server/modules/appointment/appointment.schema";
import { rescheduleAppointment } from "@/server/modules/appointment/appointment.service";

/** Moves an appointment to a new start time. */
export async function POST(
  request: Request,
  context: { params: Promise<{ appointmentId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = appointmentParamSchema.safeParse(params);
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

  const bodyValidation = rescheduleAppointmentSchema.safeParse(body);
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
    const appointment = await rescheduleAppointment(
      auth.sub,
      paramValidation.data.appointmentId,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Appointment rescheduled", data: { appointment } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AppointmentNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof AppointmentAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof AppointmentTerminalStateError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof AppointmentStartTimeInPastError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (
      error instanceof AppointmentOutsideSalonHoursError ||
      error instanceof AppointmentOutsideStaffHoursError ||
      error instanceof AppointmentStaffOnLeaveError ||
      error instanceof AppointmentSlotTakenError
    ) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("Appointment reschedule failed", error);
    return NextResponse.json(
      { message: "Unable to reschedule appointment" },
      { status: 500 },
    );
  }
}
