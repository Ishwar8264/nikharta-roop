import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { AdminAccessDeniedError } from "@/server/modules/admin/admin.errors";
import { listUsersQuerySchema } from "@/server/modules/admin/admin.schema";
import { listAdminUsers } from "@/server/modules/admin/admin.service";

/**
 * Lists platform users for the admin dashboard.
 *
 * Why:
 * The proxy already restricts `/api/v1/admin/*` to signed-in callers with a
 * valid JWT, but role enforcement lives in the service layer so this file
 * stays focused on HTTP parsing and status codes.
 */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const validation = listUsersQuerySchema.safeParse(
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
    const result = await listAdminUsers(auth.role, validation.data);
    return NextResponse.json(
      {
        message: "Users retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Admin user listing failed", error);
    return NextResponse.json(
      { message: "Unable to list users" },
      { status: 500 },
    );
  }
}
