import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { AccountDeactivatedError } from "@/server/modules/auth/auth.errors";
import { updateProfileSchema } from "@/server/modules/auth/auth.schema";
import {
  getCurrentUser,
  updateProfile,
} from "@/server/modules/auth/auth.service";
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

/**
 * Applies a partial profile update to the authenticated user.
 *
 * Why:
 * Only fields explicitly present in the body are written, so PATCH semantics
 * hold and accidental overwrites of untouched fields are impossible.
 */
export async function PATCH(request: Request): Promise<Response> {
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

  const validation = updateProfileSchema.safeParse(body);

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
    const user = await updateProfile(auth.sub, validation.data);

    return NextResponse.json(
      { message: "Profile updated", data: { user } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AccountDeactivatedError) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    console.error("Profile update failed", error);
    return NextResponse.json(
      { message: "Unable to update profile" },
      { status: 500 },
    );
  }
}
