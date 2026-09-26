import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { AdminAccessDeniedError } from "@/server/modules/admin/admin.errors";
import { aiUsageStatsQuerySchema } from "@/server/modules/admin/admin.schema";
import { getAdminAiUsageStats } from "@/server/modules/admin/admin.service";

/**
 * Aggregated AI usage stats for the admin dashboard.
 *
 * Why:
 * The three groupings (model / day / user) answer the cost and capacity
 * questions an admin actually asks. Each aggregation runs in the database —
 * no raw rows travel across the wire.
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
  const validation = aiUsageStatsQuerySchema.safeParse(
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
    const stats = await getAdminAiUsageStats(auth.role, validation.data);
    return NextResponse.json(
      { message: "AI usage stats retrieved", data: stats },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Admin AI stats failed", error);
    return NextResponse.json(
      { message: "Unable to load AI stats" },
      { status: 500 },
    );
  }
}
