import "server-only";

import { OAuth2Client } from "google-auth-library";

import { logAuthEvent } from "@/server/auth/auth.logger";
import {
  OAuthEmailMissingError,
  OAuthExchangeFailedError,
  OAuthIdTokenInvalidError,
  OAuthProviderNotConfiguredError,
} from "../oauth.errors";
import type { OAuthUserInfo } from "../oauth.types";
import type { OAuthProvider } from "./provider.types";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

/**
 * Google OAuth 2.0 + OpenID Connect provider.
 *
 * Why:
 * Google is the highest-volume provider, so it uses the modern OIDC flow
 * with a signed ID token. The library `google-auth-library` is the only
 * dependency we take in the whole OAuth module because it handles the
 * signature verification against Google's rotating JWKS correctly — that
 * check is not something to hand-roll.
 */
export const googleProvider: OAuthProvider = {
  id: "google",
  displayName: "Google",

  isConfigured: () =>
    Boolean(
      process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
      process.env.GOOGLE_OAUTH_REDIRECT_URI,
    ),

  buildAuthUrl: ({ state, codeChallenge, redirectUri }) => {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) throw new OAuthProviderNotConfiguredError("google");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      // Google requires `access_type=offline` for a refresh token, which we
      // do not need — the app's own refresh token is the long-lived one.
      // `prompt=select_account` lets the user pick between multiple
      // signed-in Google accounts instead of being auto-committed.
      access_type: "online",
      prompt: "select_account",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
  },

  exchangeCode: async ({ code, codeVerifier, redirectUri }) => {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new OAuthProviderNotConfiguredError("google");
    }

    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      logAuthEvent("warn", "oauth.token_exchange.rejected", {
        provider: "google",
        status: response.status,
      });
      throw new OAuthExchangeFailedError(
        "Google rejected the authorization code",
      );
    }

    const tokens = (await response.json()) as {
      id_token?: string;
      access_token?: string;
    };

    if (!tokens.id_token) {
      throw new OAuthExchangeFailedError("Google returned no ID token");
    }

    // Verify the ID token's signature, issuer, and audience. This is the
    // only trustworthy way to read the user's identity — decoding the JWT
    // without verification would let anyone forge a login.
    const client = new OAuth2Client({ clientId });
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new OAuthIdTokenInvalidError();
    if (!payload.sub) throw new OAuthIdTokenInvalidError("Missing subject");

    if (!payload.email) throw new OAuthEmailMissingError();

    // Google ID tokens carry `email_verified`; only a verified email is
    // safe for account linking.
    if (payload.email_verified !== true) {
      throw new OAuthEmailMissingError();
    }

    const info: OAuthUserInfo = {
      providerUserId: payload.sub,
      email: payload.email.toLowerCase(),
      emailVerified: true,
      name: payload.name ?? null,
      avatar: payload.picture ?? null,
    };

    return info;
  },
};
