import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import {
  StaffLeaveAlreadyApprovedError,
  StaffLeaveNotFoundError,
  StaffNotFoundError,
  StaffRoleInsufficientError,
  StaffSelfModificationError,
} from "@/server/modules/staff/staff.errors";
import {
  staffLeaveParamSchema,
  updateLeaveSchema,
} from "@/server/modules/staff/staff.schema";
import {
  cancelStaffLeave,
  updateStaffLeave,
} from "@/server/modules/staff/staff.service";

/** Approves or rejects a leave. MANAGER+ only, not self. */
export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ salonRef: string; staffId: string; leaveId: string }>;
  },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = staffLeaveParamSchema.safeParse(params);
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

  const bodyValidation = updateLeaveSchema.safeParse(body);
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
    const leave = await updateStaffLeave(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.staffId,
      paramValidation.data.leaveId,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Leave updated", data: { leave } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof StaffNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof StaffLeaveNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof StaffSelfModificationError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    if (error instanceof StaffRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error("Leave update failed", error);
    return NextResponse.json(
      { message: "Unable to update leave" },
      { status: 500 },
    );
  }
}

/** Cancels a leave. MANAGER+ any, staff own pending only. */
export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ salonRef: string; staffId: string; leaveId: string }>;
  },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = staffLeaveParamSchema.safeParse(params);
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

  try {
    await cancelStaffLeave(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.staffId,
      paramValidation.data.leaveId,
    );

    return NextResponse.json(
      { message: "Leave cancelled", data: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof StaffNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof StaffLeaveNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof StaffLeaveAlreadyApprovedError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    if (error instanceof StaffRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error("Leave cancellation failed", error);
    return NextResponse.json(
      { message: "Unable to cancel leave" },
      { status: 500 },
    );
  }
}
