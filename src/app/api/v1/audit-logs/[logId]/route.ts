import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  AuditLogAccessDeniedError,
  AuditLogNotFoundError,
} from "@/server/modules/audit/audit.errors";
import { auditLogParamSchema } from "@/server/modules/audit/audit.schema";
import { getLog } from "@/server/modules/audit/audit.service";

/** Loads a single audit entry. SUPER_ADMIN only. */
export async function GET(
  request: Request,
  context: { params: Promise<{ logId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const validation = auditLogParamSchema.safeParse(params);
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
    const log = await getLog(auth.role, validation.data.logId);
    return NextResponse.json(
      { message: "Audit log retrieved", data: { log } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuditLogAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof AuditLogNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Audit detail failed", error);
    return NextResponse.json(
      { message: "Unable to load audit log" },
      { status: 500 },
    );
  }
}
