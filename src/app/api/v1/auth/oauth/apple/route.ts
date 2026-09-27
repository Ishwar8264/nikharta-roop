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

/** Starts the Apple Sign In flow. */
export async function GET(request: Request): Promise<Response> {
  try {
    const state = generateState("apple");
    const codeVerifier = generatePkceVerifier();
    const codeChallenge = derivePkceChallenge(codeVerifier);

    const redirectUri = process.env.APPLE_OAUTH_REDIRECT_URI;
    if (!redirectUri) throw new OAuthProviderNotConfiguredError("apple");

    const { redirectUrl } = await initiateOAuth({
      providerId: "apple",
      state,
      codeVerifier,
      codeChallenge,
      redirectUri,
    });

    const response = NextResponse.redirect(redirectUrl);
    attachOAuthFlowCookies(response, {
      state,
      codeVerifier,
      providerId: "apple",
    });
    return response;
  } catch (error) {
    console.error("Apple OAuth initiation failed", error);
    const failureRedirect =
      process.env.OAUTH_FAILURE_REDIRECT ?? "/login?error=oauth_failed";
    return NextResponse.redirect(new URL(failureRedirect, request.url));
  }
}
