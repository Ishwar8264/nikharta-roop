import { NextResponse } from "next/server";

import {
  AccountDeactivatedError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
} from "@/server/modules/auth/auth.errors";
import { loginUserSchema } from "@/server/modules/auth/auth.schema";
import { loginUser } from "@/server/modules/auth/auth.service";

/** Access token cookie lifetime in seconds (must match token service). */
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
/** Refresh token cookie lifetime in seconds (must match token service). */
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Authenticates a user with email/phone + password.
 *
 * Why:
 * Tokens are delivered twice on purpose:
 *   - httpOnly cookies protect browser clients from XSS token theft.
 *   - The access token in the body lets non-browser clients (mobile apps,
 *     Swagger UI, CLI tools) authenticate via `Authorization: Bearer`.
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

    // Access token: readable by server + middleware, not by JS.
    response.cookies.set("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
    });

    // Refresh token: scoped to auth routes only, so it is not sent on every
    // request. Longer-lived because it exists to re-mint access tokens.
    response.cookies.set("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/v1/auth",
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    if (error instanceof EmailNotVerifiedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    if (error instanceof AccountDeactivatedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error("User login failed", error);
    return NextResponse.json({ message: "Unable to sign in" }, { status: 500 });
  }
}
