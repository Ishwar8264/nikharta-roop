import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { WorkingHoursSalonNotFoundError } from "@/server/modules/salon-working-hours/working-hours.errors";
import { replaceWorkingHoursSchema } from "@/server/modules/salon-working-hours/working-hours.schema";
import {
  getSalonWorkingHours,
  replaceSalonWorkingHours,
} from "@/server/modules/salon-working-hours/working-hours.service";
import { SalonRoleInsufficientError } from "@/server/modules/salon/salon.errors";
import { salonRefParamSchema } from "@/server/modules/salon/salon.schema";

/** Public read of a salon's weekly hours. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ salonRef: string }> },
): Promise<Response> {
  const params = await context.params;
  const validation = salonRefParamSchema.safeParse(params);

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
    const hours = await getSalonWorkingHours(validation.data.salonRef);

    return NextResponse.json(
      { message: "Working hours retrieved", data: { hours } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof WorkingHoursSalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error("Working hours fetch failed", error);
    return NextResponse.json(
      { message: "Unable to retrieve working hours" },
      { status: 500 },
    );
  }
}

/** Replaces a salon's weekly hours. MANAGER+ only. */
export async function PUT(
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

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const bodyValidation = replaceWorkingHoursSchema.safeParse(body);

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
    const hours = await replaceSalonWorkingHours(
      auth.sub,
      paramValidation.data.salonRef,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Working hours updated", data: { hours } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof WorkingHoursSalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error("Working hours update failed", error);
    return NextResponse.json(
      { message: "Unable to update working hours" },
      { status: 500 },
    );
  }
}
