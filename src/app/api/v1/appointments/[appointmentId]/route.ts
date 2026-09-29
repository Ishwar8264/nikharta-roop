import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { logDevApiEvent, unexpectedApiError } from "@/server/api/dev-response";
import {
  AppointmentAccessDeniedError,
  AppointmentNotFoundError,
} from "@/server/modules/appointment/appointment.errors";
import { appointmentParamSchema } from "@/server/modules/appointment/appointment.schema";
import { getAppointment } from "@/server/modules/appointment/appointment.service";

/** Loads a single appointment the caller has access to. */
export async function GET(
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
  const validation = appointmentParamSchema.safeParse(params);
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
    const appointment = await getAppointment(
      auth.sub,
      validation.data.appointmentId,
    );
    logDevApiEvent("appointments.detail.success", {
      userId: auth.sub,
      appointmentId: appointment.id,
    });

    return NextResponse.json(
      { message: "Appointment retrieved", data: { appointment } },
      { status: 200 },
    );
  } catch (error) {
    logDevApiEvent("appointments.detail.rejected", {
      userId: auth.sub,
      appointmentId: validation.data.appointmentId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    if (error instanceof AppointmentNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof AppointmentAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    return unexpectedApiError(
      "appointments.detail.failed",
      error,
      "Unable to retrieve appointment",
    );
  }
}
