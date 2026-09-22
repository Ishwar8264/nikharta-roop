import { NextResponse } from "next/server";

import { clearSessionCookies } from "@/server/auth/cookies";
import { getAuthContext } from "@/server/auth/session";
import { InvalidCurrentPasswordError } from "@/server/modules/auth/auth.errors";
import { deleteAccountSchema } from "@/server/modules/auth/auth.schema";
import { deleteAccount } from "@/server/modules/auth/auth.service";

/**
 * Soft-deletes the authenticated user's account.
 *
 * Why:
 * Requires the current password in the body as a second factor. This mirrors
 * the "type your password to confirm" flow used by production systems — a
 * stolen access token alone is not enough to destroy the account.
 *
 * The row keeps its `deletedAt` marker so appointments, reviews, and audit
 * trails retain their foreign keys. All refresh tokens are revoked in the
 * same transaction; short-lived access tokens expire naturally in 15 min.
 */
export async function DELETE(request: Request): Promise<Response> {
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
      {
        message: "Request body must be valid JSON and include your password",
      },
      { status: 400 },
    );
  }

  const validation = deleteAccountSchema.safeParse(body);

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
    await deleteAccount(auth.sub, validation.data);

    const response = NextResponse.json(
      { message: "Account deleted", data: null },
      { status: 200 },
    );

    // Clear cookies so the browser stops presenting stale credentials.
    clearSessionCookies(response);

    return response;
  } catch (error) {
    if (error instanceof InvalidCurrentPasswordError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    console.error("Account deletion failed", error);
    return NextResponse.json(
      { message: "Unable to delete account" },
      { status: 500 },
    );
  }
}
