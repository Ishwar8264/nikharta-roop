import { NextResponse } from "next/server";

import {
  createAuthRequestId,
  logAuthError,
  logAuthEvent,
} from "@/server/auth/auth.logger";
import { setSessionCookies } from "@/server/auth/cookies";
import {
  OAuthEmailMissingError,
  OAuthProviderNotConfiguredError,
  OAuthStateInvalidError,
  OAuthStateProviderMismatchError,
} from "@/server/auth/oauth/oauth.errors";
import {
  clearOAuthFlowCookies,
  readOAuthStateCookie,
  readOAuthVerifierCookie,
  resolveOAuthRedirect,
} from "@/server/auth/oauth/oauth.helpers";
import { completeOAuth } from "@/server/auth/oauth/oauth.service";
import { verifyStateProvider } from "@/server/auth/oauth/oauth.state";

export const runtime = "nodejs";

/** Handles Facebook's callback. */
export async function GET(request: Request): Promise<Response> {
  const requestId = createAuthRequestId(request);
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

    logAuthEvent("info", "oauth.callback.succeeded", {
      requestId,
      provider: "facebook",
      isNewUser: result.isNewUser,
    });

    return buildSuccessRedirect(request, successRedirect, result);
  } catch (error) {
    if (error instanceof OAuthStateProviderMismatchError) {
      logAuthEvent("warn", "oauth.callback.rejected", {
        requestId,
        provider: "facebook",
        reason: "state_provider_mismatch",
      });
      return buildFailureRedirect(request, failureRedirect, "state_mismatch");
    }
    if (error instanceof OAuthStateInvalidError) {
      logAuthEvent("warn", "oauth.callback.rejected", {
        requestId,
        provider: "facebook",
        reason: "state_invalid",
      });
      return buildFailureRedirect(request, failureRedirect, "state_invalid");
    }
    if (error instanceof OAuthEmailMissingError) {
      logAuthEvent("warn", "oauth.callback.rejected", {
        requestId,
        provider: "facebook",
        reason: "email_missing",
      });
      return buildFailureRedirect(request, failureRedirect, "email_missing");
    }
    logAuthError("oauth.callback.failed", error, {
      requestId,
      provider: "facebook",
    });
    return buildFailureRedirect(request, failureRedirect, "oauth_failed");
  }
}

function buildFailureRedirect(
  request: Request,
  target: string,
  reason: string,
): NextResponse {
  const url = resolveOAuthRedirect(request, target);
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
  const response = NextResponse.redirect(resolveOAuthRedirect(request, target));

  setSessionCookies(response, result);
  clearOAuthFlowCookies(response);
  return response;
}
