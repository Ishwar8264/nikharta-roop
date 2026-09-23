import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { AppointmentAccessDeniedError } from "@/server/modules/appointment/appointment.errors";
import { listSalonAppointmentsQuerySchema } from "@/server/modules/appointment/appointment.schema";
import { listAppointmentsForSalon } from "@/server/modules/appointment/appointment.service";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { salonRefParamSchema } from "@/server/modules/salon/salon.schema";

/** Lists appointments for a salon. MANAGER+ only. */
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

  const url = new URL(request.url);
  const queryValidation = listSalonAppointmentsQuerySchema.safeParse(
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
    const result = await listAppointmentsForSalon(
      auth.sub,
      paramValidation.data.salonRef,
      queryValidation.data,
    );

    return NextResponse.json(
      {
        message: "Appointments retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof AppointmentAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error("Salon appointment listing failed", error);
    return NextResponse.json(
      { message: "Unable to list appointments" },
      { status: 500 },
    );
  }
}
