import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  AdminAccessDeniedError,
  AdminQuotaBelowUsageError,
  AdminUserNotFoundError,
} from "@/server/modules/admin/admin.errors";
import {
  adminUserParamSchema,
  updateAiQuotaSchema,
} from "@/server/modules/admin/admin.schema";
import { setUserAiQuota } from "@/server/modules/admin/admin.service";

/**
 * Adjusts a user's AI quota limits.
 *
 * Why:
 * A limit set below the amount already consumed would leave the user
 * permanently exhausted on their next call. The service layer rejects that
 * with a 409 so the admin can pick a higher value or reset the counters.
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

  const bodyValidation = updateAiQuotaSchema.safeParse(body);
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
    const user = await setUserAiQuota(
      auth.role,
      paramValidation.data.userId,
      bodyValidation.data,
    );
    return NextResponse.json(
      { message: "AI quota updated", data: { user } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof AdminUserNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof AdminQuotaBelowUsageError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error("Admin AI quota change failed", error);
    return NextResponse.json(
      { message: "Unable to update AI quota" },
      { status: 500 },
    );
  }
}
