import { listUserSalonMemberships } from "@/server/modules/salon/salon.repository";
import { routes } from "@/config/routes";
import { NextResponse } from "next/server";

import { setSessionCookies } from "@/server/auth/cookies";
import { issueTokenPair } from "@/server/auth/token.service";
import { getCurrentUser } from "@/server/modules/auth/auth.service";
import {
  OtpAccountSetupRequiredError,
  OtpExpiredError,
  OtpInvalidError,
  OtpMaxAttemptsError,
} from "@/server/modules/otp/otp.errors";
import { WeakPasswordError } from "@/server/modules/auth/auth.errors";
import { verifyOtpSchema } from "@/server/modules/otp/otp.schema";
import { verifyOtpCode } from "@/server/modules/otp/otp.service";

/**
 * Verifies an OTP and marks the corresponding identifier as verified.
 *
 * Why this route also issues tokens:
 * Successful verification is proof the user controls the identifier they
 * registered with. Having them re-enter their password on a separate login
 * page adds friction without adding security — the email round-trip already
 * proved what a password would prove. So we open a session here, matching
 * how GitHub, Linear, and Vercel handle post-verify flows.
 *
 * Public route — an unverified user cannot log in, so they have no token to
 * authenticate with here. Error messages stay informative but never reveal
 * whether the identifier exists.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const validation = verifyOtpSchema.safeParse(body);

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
    const result = await verifyOtpCode(validation.data);
    // Staff activation must not replace an owner session or sign in the invited member.
    if (validation.data.createSession === false) {
      const memberships = await listUserSalonMemberships(result.userId);
      const membership = memberships.find(({ role, salon }) => role !== "OWNER" && salon.isActive);
      const staffProfileUrl = membership ? routes.salonStaffDetail(membership.salon.slug, membership.slug ?? membership.id) : routes.profile;
      return NextResponse.json({ message: "Verification successful", data: { ...result, staffProfileUrl } }, { status: 200 });
    }

    // Verification flipped the emailVerified flag; now load the full user
    // record so we can issue tokens with the correct role. getCurrentUser
    // returns null only if the user vanished between the two calls, which
    // would be a rare race — treat it as a server error rather than a 401
    // because the OTP itself was valid.
    const user = await getCurrentUser(result.userId);
    if (!user) {
      return NextResponse.json(
        { message: "Unable to verify code" },
        { status: 500 },
      );
    }

    const tokens = await issueTokenPair(user.id, user.role, {
      userAgent: request.headers.get("user-agent") ?? undefined,
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        undefined,
    });

    const response = NextResponse.json(
      {
        message: "Verification successful",
        data: {
          user,
          accessToken: tokens.accessToken,
          accessTokenExpiresIn: tokens.accessTokenExpiresIn,
        },
      },
      { status: 200 },
    );

    // Sets accessToken, refreshToken, and a fresh csrfToken cookie — same
    // contract as the login route, so the browser lands signed-in.
    setSessionCookies(response, tokens);

    return response;
  } catch (error) {
    if (error instanceof OtpAccountSetupRequiredError) {
      return NextResponse.json({ message: error.message, code: "ACCOUNT_SETUP_REQUIRED" }, { status: 422 });
    }

    if (error instanceof OtpInvalidError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error instanceof OtpExpiredError) {
      return NextResponse.json({ message: error.message }, { status: 410 });
    }

    if (error instanceof OtpMaxAttemptsError) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }

    if (error instanceof WeakPasswordError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Unable to verify code" },
      { status: 500 },
    );
  }
}
