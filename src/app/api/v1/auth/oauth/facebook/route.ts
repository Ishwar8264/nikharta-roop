import { NextResponse } from "next/server";

import {
  createAuthRequestId,
  logAuthError,
  logAuthEvent,
} from "@/server/auth/auth.logger";
import { OAuthProviderNotConfiguredError } from "@/server/auth/oauth/oauth.errors";
import {
  attachOAuthFlowCookies,
  resolveOAuthRedirect,
} from "@/server/auth/oauth/oauth.helpers";
import { initiateOAuth } from "@/server/auth/oauth/oauth.service";
import {
  derivePkceChallenge,
  generatePkceVerifier,
  generateState,
} from "@/server/auth/oauth/oauth.state";

export const runtime = "nodejs";

/** Starts the Facebook Login flow. */
export async function GET(request: Request): Promise<Response> {
  const requestId = createAuthRequestId(request);

  try {
    const state = generateState("facebook");
    const codeVerifier = generatePkceVerifier();
    const codeChallenge = derivePkceChallenge(codeVerifier);

    const redirectUri = process.env.FACEBOOK_OAUTH_REDIRECT_URI;
    if (!redirectUri) throw new OAuthProviderNotConfiguredError("facebook");

    const { redirectUrl } = await initiateOAuth({
      providerId: "facebook",
      state,
      codeVerifier,
      codeChallenge,
      redirectUri,
    });

    const response = NextResponse.redirect(redirectUrl);
    attachOAuthFlowCookies(response, {
      state,
      codeVerifier,
      providerId: "facebook",
    });
    logAuthEvent("info", "oauth.initiated", {
      requestId,
      provider: "facebook",
    });
    return response;
  } catch (error) {
    logAuthError("oauth.initiation.failed", error, {
      requestId,
      provider: "facebook",
    });
    const failureRedirect =
      process.env.OAUTH_FAILURE_REDIRECT ?? "/login?error=oauth_failed";
    return NextResponse.redirect(resolveOAuthRedirect(request, failureRedirect));
  }
}
