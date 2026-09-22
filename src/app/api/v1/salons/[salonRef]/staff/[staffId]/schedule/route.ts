import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import {
  StaffNotFoundError,
  StaffRoleInsufficientError,
  StaffSelfModificationError,
} from "@/server/modules/staff/staff.errors";
import {
  replaceScheduleSchema,
  staffParamSchema,
} from "@/server/modules/staff/staff.schema";
import {
  getSchedule,
  replaceSchedule,
} from "@/server/modules/staff/staff.service";

/** Returns the weekly schedule for a staff member. */
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
    const schedule = await getSchedule(
      auth.sub,
      validation.data.salonRef,
      validation.data.staffId,
    );

    return NextResponse.json(
      { message: "Schedule retrieved", data: { schedule } },
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

    console.error("Schedule fetch failed", error);
    return NextResponse.json(
      { message: "Unable to retrieve schedule" },
      { status: 500 },
    );
  }
}

/** Replaces the weekly schedule for a staff member. MANAGER+ only. */
export async function PUT(
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
  const paramValidation = staffParamSchema.safeParse(params);
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

  const bodyValidation = replaceScheduleSchema.safeParse(body);
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
    const schedule = await replaceSchedule(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.staffId,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Schedule updated", data: { schedule } },
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

    if (error instanceof StaffSelfModificationError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error("Schedule update failed", error);
    return NextResponse.json(
      { message: "Unable to update schedule" },
      { status: 500 },
    );
  }
}
