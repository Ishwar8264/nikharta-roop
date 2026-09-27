import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE_NAME,
  ACCESS_TOKEN_TTL_SECONDS,
  CSRF_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_SECONDS,
} from "@/server/auth/auth.constants";
import { generateCsrfToken } from "@/server/auth/csrf";
import {
  OAuthProviderNotConfiguredError,
  OAuthStateInvalidError,
  OAuthStateProviderMismatchError,
} from "@/server/auth/oauth/oauth.errors";
import {
  clearOAuthFlowCookies,
  readOAuthStateCookie,
  readOAuthVerifierCookie,
} from "@/server/auth/oauth/oauth.helpers";
import { completeOAuth } from "@/server/auth/oauth/oauth.service";
import { verifyStateProvider } from "@/server/auth/oauth/oauth.state";

export const runtime = "nodejs";

/** Handles Facebook's callback. */
export async function GET(request: Request): Promise<Response> {
  const failureRedirect =
    process.env.OAUTH_FAILURE_REDIRECT ?? "/login?error=oauth_failed";
  const successRedirect = process.env.OAUTH_SUCCESS_REDIRECT ?? "/dashboard";

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");
    const errorParam = url.searchParams.get("error");

    if (errorParam) {
      return buildFailureRedirect(request, failureRedirect, "provider_denied");
    }
    if (!code || !returnedState) {
      return buildFailureRedirect(request, failureRedirect, "missing_params");
    }

    const cookieState = readOAuthStateCookie(request);
    const codeVerifier = readOAuthVerifierCookie(request);

    if (!cookieState || !codeVerifier || cookieState !== returnedState) {
      throw new OAuthStateInvalidError();
    }
    verifyStateProvider(returnedState, "facebook");

    const redirectUri = process.env.FACEBOOK_OAUTH_REDIRECT_URI;
    if (!redirectUri) throw new OAuthProviderNotConfiguredError("facebook");

    const result = await completeOAuth({
      providerId: "facebook",
      code,
      codeVerifier,
      redirectUri,
      metadata: {
        userAgent: request.headers.get("user-agent") ?? undefined,
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          undefined,
      },
    });

    return buildSuccessRedirect(request, successRedirect, result);
  } catch (error) {
    if (error instanceof OAuthStateProviderMismatchError) {
      return buildFailureRedirect(request, failureRedirect, "state_mismatch");
    }
    if (error instanceof OAuthStateInvalidError) {
      return buildFailureRedirect(request, failureRedirect, "state_invalid");
    }
    console.error("Facebook OAuth callback failed", error);
    return buildFailureRedirect(request, failureRedirect, "oauth_failed");
  }
}

function buildFailureRedirect(
  request: Request,
  target: string,
  reason: string,
): NextResponse {
  const url = new URL(target, request.url);
  url.searchParams.set("reason", reason);
  const response = NextResponse.redirect(url.toString());
  clearOAuthFlowCookies(response);
  return response;
}

function buildSuccessRedirect(
  request: Request,
  target: string,
  result: {
    accessToken: string;
    refreshToken: string;
  },
): NextResponse {
  const response = NextResponse.redirect(
    new URL(target, request.url).toString(),
  );

  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(ACCESS_COOKIE_NAME, result.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });
  response.cookies.set(REFRESH_COOKIE_NAME, result.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
  response.cookies.set(CSRF_COOKIE_NAME, generateCsrfToken(), {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });

  clearOAuthFlowCookies(response);
  return response;
}
