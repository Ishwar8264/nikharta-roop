import { NextResponse } from "next/server";

import { setSessionCookies } from "@/server/auth/cookies";
import { getAuthContext } from "@/server/auth/session";
import { InvalidCurrentPasswordError } from "@/server/modules/auth/auth.errors";
import { changePasswordSchema } from "@/server/modules/auth/auth.schema";
import { changePassword } from "@/server/modules/auth/auth.service";
import { PasswordUnchangedError } from "@/server/modules/password/password.errors";

/**
 * Changes the password for the authenticated user.
 *
 * Why:
 * Authenticated endpoint — caller must present a valid access token. The
 * current password is re-verified so a stolen token alone cannot lock the
 * real owner out. All old sessions are revoked and this device receives a new
 * token pair on success.
 */
export async function POST(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
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

  const validation = changePasswordSchema.safeParse(body);

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
    const tokens = await changePassword(auth.sub, validation.data, {
      userAgent: request.headers.get("user-agent") ?? undefined,
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        undefined,
    });
    const response = NextResponse.json(
      {
        message: "Password updated successfully",
        data: {
          accessToken: tokens.accessToken,
          accessTokenExpiresIn: tokens.accessTokenExpiresIn,
        },
      },
      { status: 200 },
    );
    setSessionCookies(response, tokens);

    return response;
  } catch (error) {
    if (error instanceof InvalidCurrentPasswordError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    if (error instanceof PasswordUnchangedError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("Password change failed", error);
    return NextResponse.json(
      { message: "Unable to change password" },
      { status: 500 },
    );
  }
}
