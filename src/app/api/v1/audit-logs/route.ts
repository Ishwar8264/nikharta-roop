import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { AuditLogAccessDeniedError } from "@/server/modules/audit/audit.errors";
import { listAuditLogsQuerySchema } from "@/server/modules/audit/audit.schema";
import { listLogs } from "@/server/modules/audit/audit.service";

/** Lists audit log entries. SUPER_ADMIN only. */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const validation = listAuditLogsQuerySchema.safeParse(
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
    const result = await listLogs(auth.role, validation.data);
    return NextResponse.json(
      {
        message: "Audit logs retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuditLogAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Audit listing failed", error);
    return NextResponse.json(
      { message: "Unable to list audit logs" },
      { status: 500 },
    );
  }
}
