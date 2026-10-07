import { NextResponse } from "next/server";

import { REFRESH_COOKIE_NAME } from "@/server/auth/auth.constants";
import { clearSessionCookies } from "@/server/auth/cookies";
import { getAuthContext, readCookie } from "@/server/auth/session";
import { sessionIdSchema } from "@/server/modules/auth/auth.schema";
import { revokeSession } from "@/server/modules/auth/auth.service";

/** Revokes one active session owned by the authenticated user. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const validation = sessionIdSchema.safeParse(id);

  if (!validation.success) {
    return NextResponse.json(
      { message: validation.error.issues[0]?.message ?? "Invalid session ID" },
      { status: 400 },
    );
  }

  try {
    const result = await revokeSession(
      auth.sub,
      validation.data,
      readCookie(request, REFRESH_COOKIE_NAME),
    );

    if (!result.revoked) {
      // Ownership and existence intentionally share one response so another
      // user's session IDs cannot be enumerated.
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 },
      );
    }

    const response = NextResponse.json(
      { message: "Session revoked", data: null },
      { status: 200 },
    );

    if (result.wasCurrent) {
      clearSessionCookies(response);
    }

    return response;
  } catch (error) {
    console.error("Failed to revoke session", error);
    return NextResponse.json(
      { message: "Unable to revoke session" },
      { status: 500 },
    );
  }
}
