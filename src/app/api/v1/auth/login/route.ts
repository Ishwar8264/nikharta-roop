import { NextResponse } from "next/server";

import { setSessionCookies } from "@/server/auth/cookies";
import {
  AccountDeactivatedError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
} from "@/server/modules/auth/auth.errors";
import { loginUserSchema } from "@/server/modules/auth/auth.schema";
import { loginUser } from "@/server/modules/auth/auth.service";

/**
 * Authenticates a user with verified email + password.
 *
 * Why:
 * The access token is delivered through both browser and API-friendly paths:
 *   - httpOnly cookies protect browser clients from XSS token theft.
 *   - The response body lets non-browser clients authenticate via bearer.
 * Refresh rotation remains cookie-based so raw long-lived credentials never
 * enter JavaScript-accessible response data.
 * The route itself stays thin — parsing, validation, status codes only.
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

  const validation = loginUserSchema.safeParse(body);

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
    const result = await loginUser(validation.data, {
      userAgent: request.headers.get("user-agent") ?? undefined,
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        undefined,
    });

    const response = NextResponse.json(
      {
        message: "Login successful",
        data: {
          user: result.user,
          accessToken: result.accessToken,
          accessTokenExpiresIn: result.accessTokenExpiresIn,
        },
      },
      { status: 200 },
    );

    setSessionCookies(response, result);

    return response;
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    if (error instanceof EmailNotVerifiedError) {
      // Same status + message as invalid credentials so the endpoint cannot
      // be used to enumerate registered-but-unverified accounts. The service
      // re-sends the verification code to the real owner as a side effect.
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (error instanceof AccountDeactivatedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    return NextResponse.json({ message: "Unable to sign in" }, { status: 500 });
  }
}
