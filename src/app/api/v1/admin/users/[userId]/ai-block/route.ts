import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  AdminAccessDeniedError,
  AdminUserNotFoundError,
} from "@/server/modules/admin/admin.errors";
import {
  adminUserParamSchema,
  updateAiBlockSchema,
} from "@/server/modules/admin/admin.schema";
import { setUserAiBlock } from "@/server/modules/admin/admin.service";

/**
 * Blocks or unblocks a user from the AI feature.
 *
 * Why:
 * The `isBlocked` flag on `UserAiUsage` is checked on every streaming
 * request, so the change takes effect immediately on the user's next
 * message. `reason` is mandatory when blocking so the audit trail always
 * explains the action.
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

  const bodyValidation = updateAiBlockSchema.safeParse(body);
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
    const user = await setUserAiBlock(
      auth.role,
      paramValidation.data.userId,
      bodyValidation.data,
    );
    return NextResponse.json(
      { message: "AI access updated", data: { user } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof AdminUserNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Admin AI block change failed", error);
    return NextResponse.json(
      { message: "Unable to update AI access" },
      { status: 500 },
    );
  }
}
