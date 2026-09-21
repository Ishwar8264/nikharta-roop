import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { getCurrentUser } from "@/server/modules/auth/auth.service";

/**
 * Returns the authenticated user's profile.
 *
 * Why:
 * This is the canonical "am I signed in?" check for clients. It accepts either
 * an `Authorization: Bearer` header or the `accessToken` cookie, and always
 * re-reads the user from the database so role changes and soft-deletes take
 * effect immediately instead of waiting for the access token to expire.
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
    const user = await getCurrentUser(auth.sub);

    // Token was valid but the account is gone (deleted or removed). Treat
    // the same as unauthenticated so the client clears local state.
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        message: "Current user",
        data: { user },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to load current user", error);
    return NextResponse.json(
      { message: "Unable to load user" },
      { status: 500 },
    );
  }
}
