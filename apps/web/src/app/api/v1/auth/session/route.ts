import { NextResponse } from "next/server";

import { REFRESH_COOKIE_NAME } from "@/server/auth/auth.constants";
import { getAuthContext, readCookie } from "@/server/auth/session";
import { listSessions } from "@/server/modules/auth/auth.service";

/**
 * Lists every active refresh session owned by the authenticated user.
 *
 * Why:
 * Device and network metadata helps users recognize suspicious sign-ins. The
 * token hash never leaves the server; the cookie-backed session is identified
 * with a boolean so clients can label the current device safely.
 */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const sessions = await listSessions(
      auth.sub,
      readCookie(request, REFRESH_COOKIE_NAME),
    );

    return NextResponse.json(
      { message: "Active sessions", data: { sessions } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to list sessions", error);
    return NextResponse.json(
      { message: "Unable to load sessions" },
      { status: 500 },
    );
  }
}
