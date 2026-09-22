import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import {
  StaffNotFoundError,
  StaffRoleInsufficientError,
  StaffSkillServiceMismatchError,
} from "@/server/modules/staff/staff.errors";
import {
  replaceSkillsSchema,
  staffParamSchema,
} from "@/server/modules/staff/staff.schema";
import { getSkills, replaceSkills } from "@/server/modules/staff/staff.service";

/** Lists skills. MANAGER+ or self. */
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
    const skills = await getSkills(
      auth.sub,
      validation.data.salonRef,
      validation.data.staffId,
    );

    return NextResponse.json(
      { message: "Skills retrieved", data: { skills } },
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

    console.error("Skill listing failed", error);
    return NextResponse.json(
      { message: "Unable to list skills" },
      { status: 500 },
    );
  }
}

/** Replaces skills. MANAGER+ only. */
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

  const bodyValidation = replaceSkillsSchema.safeParse(body);
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
    const skills = await replaceSkills(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.staffId,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Skills updated", data: { skills } },
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

    if (error instanceof StaffSkillServiceMismatchError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("Skill update failed", error);
    return NextResponse.json(
      { message: "Unable to update skills" },
      { status: 500 },
    );
  }
}
