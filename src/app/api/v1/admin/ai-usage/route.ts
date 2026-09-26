import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { AdminAccessDeniedError } from "@/server/modules/admin/admin.errors";
import { listAiUsageQuerySchema } from "@/server/modules/admin/admin.schema";
import { listAdminAiUsageLogs } from "@/server/modules/admin/admin.service";

/**
 * Lists AI usage log rows for the admin cost dashboard.
 *
 * Why:
 * Raw rows support the "who spent what, when" view. Aggregations live on
 * the sibling `stats` endpoint so the two views do not interfere.
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
  const validation = listAiUsageQuerySchema.safeParse(
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
    const result = await listAdminAiUsageLogs(auth.role, validation.data);
    return NextResponse.json(
      {
        message: "AI usage retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Admin AI usage listing failed", error);
    return NextResponse.json(
      { message: "Unable to list AI usage" },
      { status: 500 },
    );
  }
}
