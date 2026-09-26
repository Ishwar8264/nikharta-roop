import { NextResponse } from "next/server";

import { OAuthProviderNotConfiguredError } from "@/server/auth/oauth/oauth.errors";
import { attachOAuthFlowCookies } from "@/server/auth/oauth/oauth.helpers";
import { initiateOAuth } from "@/server/auth/oauth/oauth.service";
import {
  derivePkceChallenge,
  generatePkceVerifier,
  generateState,
} from "@/server/auth/oauth/oauth.state";

export const runtime = "nodejs";

/** Starts the Facebook Login flow. */
export async function GET(): Promise<Response> {
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
    return response;
  } catch (error) {
    console.error("Facebook OAuth initiation failed", error);
    const failureRedirect =
      process.env.OAUTH_FAILURE_REDIRECT ?? "/login?error=oauth_failed";
    return NextResponse.redirect(new URL(failureRedirect, "http://localhost"));
  }
}
