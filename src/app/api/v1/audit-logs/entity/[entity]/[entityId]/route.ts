import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { AuditLogAccessDeniedError } from "@/server/modules/audit/audit.errors";
import {
  auditEntityParamSchema,
  listAuditLogsQuerySchema,
} from "@/server/modules/audit/audit.schema";
import { listEntityHistory } from "@/server/modules/audit/audit.service";

/** Returns the change history of one entity. SUPER_ADMIN only. */
export async function GET(
  request: Request,
  context: { params: Promise<{ entity: string; entityId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = auditEntityParamSchema.safeParse(params);
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

  const url = new URL(request.url);
  const queryValidation = listAuditLogsQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
  if (!queryValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: queryValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const result = await listEntityHistory(
      auth.role,
      paramValidation.data.entity,
      paramValidation.data.entityId,
      queryValidation.data,
    );
    return NextResponse.json(
      {
        message: "Entity history retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuditLogAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Entity history failed", error);
    return NextResponse.json(
      { message: "Unable to load entity history" },
      { status: 500 },
    );
  }
}
