import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  AdminAccessDeniedError,
  AdminLastSuperAdminError,
  AdminSelfDemotionError,
  AdminUserNotFoundError,
} from "@/server/modules/admin/admin.errors";
import {
  adminUserParamSchema,
  updateUserRoleSchema,
} from "@/server/modules/admin/admin.schema";
import { changeUserRole } from "@/server/modules/admin/admin.service";

/**
 * Changes a user's platform role.
 *
 * Why:
 * Only SUPER_ADMINs may call this. Two invariants are enforced in the
 * service layer: no self-demotion, and the platform always retains at least
 * one active SUPER_ADMIN.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = adminUserParamSchema.safeParse(params);
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

  const bodyValidation = updateUserRoleSchema.safeParse(body);
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
    const user = await changeUserRole(
      auth.sub,
      auth.role,
      paramValidation.data.userId,
      bodyValidation.data,
    );
    return NextResponse.json(
      { message: "Role updated", data: { user } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof AdminUserNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof AdminSelfDemotionError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof AdminLastSuperAdminError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error("Admin role change failed", error);
    return NextResponse.json(
      { message: "Unable to change role" },
      { status: 500 },
    );
  }
}
