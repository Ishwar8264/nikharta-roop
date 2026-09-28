import { NextResponse } from "next/server";

import { setSessionCookies } from "@/server/auth/cookies";
import {
  createAuthRequestId,
  logAuthError,
  logAuthEvent,
} from "@/server/auth/auth.logger";
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
  const requestId = createAuthRequestId(request);
  let body: unknown;

  logAuthEvent("info", "login.attempted", {
    requestId,
    method: "password",
  });

  try {
    body = await request.json();
  } catch {
    logAuthEvent("warn", "login.rejected", {
      requestId,
      method: "password",
      reason: "invalid_json",
      status: 400,
    });
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const validation = loginUserSchema.safeParse(body);

  if (!validation.success) {
    logAuthEvent("warn", "login.rejected", {
      requestId,
      method: "password",
      reason: "validation_failed",
      status: 400,
    });
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
    logAuthEvent("info", "login.succeeded", {
      requestId,
      method: "password",
      sessionIssued: true,
      status: 200,
    });

    return response;
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      logAuthEvent("warn", "login.rejected", {
        requestId,
        method: "password",
        reason: "invalid_credentials",
        status: 401,
      });
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    if (error instanceof EmailNotVerifiedError) {
      logAuthEvent("warn", "login.rejected", {
        requestId,
        method: "password",
        reason: "email_not_verified",
        status: 403,
      });
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    if (error instanceof AccountDeactivatedError) {
      logAuthEvent("warn", "login.rejected", {
        requestId,
        method: "password",
        reason: "account_deactivated",
        status: 403,
      });
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    logAuthError("login.failed", error, {
      requestId,
      method: "password",
      status: 500,
    });
    return NextResponse.json({ message: "Unable to sign in" }, { status: 500 });
  }
}
