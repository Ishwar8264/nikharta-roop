import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import {
  StaffLeaveOverlapError,
  StaffNotFoundError,
  StaffRoleInsufficientError,
} from "@/server/modules/staff/staff.errors";
import {
  createLeaveSchema,
  staffParamSchema,
} from "@/server/modules/staff/staff.schema";
import {
  createStaffLeave,
  listLeaves,
} from "@/server/modules/staff/staff.service";

/** Lists leave requests for a staff member. MANAGER+ or self. */
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
    const result = await listLeaves(
      auth.sub,
      validation.data.salonRef,
      validation.data.staffId,
    );

    return NextResponse.json(
      {
        message: "Leaves retrieved",
        data: result.items,
        meta: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      },
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

    console.error("Leave listing failed", error);
    return NextResponse.json(
      { message: "Unable to list leaves" },
      { status: 500 },
    );
  }
}

/** Creates a leave request. MANAGER+ or self. */
export async function POST(
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

  const bodyValidation = createLeaveSchema.safeParse(body);
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
    const leave = await createStaffLeave(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.staffId,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Leave requested", data: { leave } },
      { status: 201 },
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

    if (error instanceof StaffLeaveOverlapError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("Leave creation failed", error);
    return NextResponse.json(
      { message: "Unable to create leave" },
      { status: 500 },
    );
  }
}
