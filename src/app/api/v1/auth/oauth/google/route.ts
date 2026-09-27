import { NextResponse } from "next/server";

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

/**
 * Starts the Google OAuth flow.
 *
 * Why:
 * The route is a three-line coordinator: generate state + PKCE, ask the
 * service for the redirect URL, attach cookies, redirect. Every guard and
 * piece of security logic lives behind the imported helpers so this file
 * stays trivial to audit.
 *
 * The state is bound to the provider via a `google:` prefix — that prefix
 * is what protects against a state issued by Google being replayed on the
 * Apple callback (CVE-2026-73419 in Auth.js).
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const state = generateState("google");
    const codeVerifier = generatePkceVerifier();
    const codeChallenge = derivePkceChallenge(codeVerifier);

    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
    if (!redirectUri) throw new OAuthProviderNotConfiguredError("google");

    const { redirectUrl } = await initiateOAuth({
      providerId: "google",
      state,
      codeVerifier,
      codeChallenge,
      redirectUri,
    });

    const response = NextResponse.redirect(redirectUrl);
    attachOAuthFlowCookies(response, {
      state,
      codeVerifier,
      providerId: "google",
    });
    return response;
  } catch (error) {
    console.error("Google OAuth initiation failed", error);
    const failureRedirect =
      process.env.OAUTH_FAILURE_REDIRECT ?? "/login?error=oauth_failed";
    return NextResponse.redirect(resolveOAuthRedirect(request, failureRedirect));
  }
}
