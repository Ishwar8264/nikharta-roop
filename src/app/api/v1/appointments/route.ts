import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { logDevApiEvent, unexpectedApiError } from "@/server/api/dev-response";
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
import {
  CouponMinOrderNotMetError,
  CouponNotActiveError,
  CouponNotFoundError,
  CouponPerUserLimitReachedError,
  CouponUsageLimitReachedError,
} from "@/server/modules/coupon/coupon.errors";
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
    logDevApiEvent("appointments.list.success", {
      userId: auth.sub,
      count: result.items.length,
      hasMore: result.hasMore,
    });

    return NextResponse.json(
      {
        message: "Appointments retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    return unexpectedApiError(
      "appointments.list.failed",
      error,
      "Unable to list appointments",
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
    logDevApiEvent("appointments.create.success", {
      userId: auth.sub,
      appointmentId: appointment.id,
      salonId: appointment.salonId,
    });

    return NextResponse.json(
      { message: "Appointment created", data: { appointment } },
      { status: 201 },
    );
  } catch (error) {
    logDevApiEvent("appointments.create.rejected", {
      userId: auth.sub,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
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
    if (error instanceof CouponNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof CouponNotActiveError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (
      error instanceof CouponUsageLimitReachedError ||
      error instanceof CouponPerUserLimitReachedError
    ) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof CouponMinOrderNotMetError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return unexpectedApiError(
      "appointments.create.failed",
      error,
      "Unable to create appointment",
    );
  }
}
