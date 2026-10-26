import "server-only";

import { SignJWT, createRemoteJWKSet, jwtVerify } from "jose";

import {
  OAuthEmailMissingError,
  OAuthExchangeFailedError,
  OAuthIdTokenInvalidError,
  OAuthProviderNotConfiguredError,
} from "../oauth.errors";
import type { OAuthUserInfo } from "../oauth.types";
import type { OAuthProvider } from "./provider.types";

const APPLE_AUTH_ENDPOINT = "https://appleid.apple.com/auth/authorize";
const APPLE_TOKEN_ENDPOINT = "https://appleid.apple.com/auth/token";
const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS_URL = new URL("https://appleid.apple.com/auth/keys");

/**
 * Remote JWKS for Apple's ID tokens.
 *
 * Why:
 * Apple rotates signing keys. `createRemoteJWKSet` caches them and refreshes
 * on rotation, so we never hardcode a key that could go stale. Kept at module
 * scope so the cache is shared across requests.
 */
const APPLE_JWKS = createRemoteJWKSet(APPLE_JWKS_URL);

/**
 * Apple Sign In provider.
 *
 * Why:
 * Apple's flow is the most unusual of the three:
 *   1. `client_secret` is not a static string — it is a JWT signed with the
 *      developer's `.p8` private key, valid for up to 6 months, and
 *      regenerated on every exchange by this provider.
 *   2. The user's name and email are only included in the ID token on the
 *      *first* authorization. On subsequent logins they are absent, so we
 *      must be prepared for `name` to be null.
 *   3. The `email_verified` claim is a string ("true"/"false") rather than a
 *      boolean, unlike every other provider.
 */
export const appleProvider: OAuthProvider = {
  id: "apple",
  displayName: "Apple",

  isConfigured: () =>
    Boolean(
      process.env.APPLE_OAUTH_CLIENT_ID &&
      process.env.APPLE_OAUTH_TEAM_ID &&
      process.env.APPLE_OAUTH_KEY_ID &&
      process.env.APPLE_OAUTH_PRIVATE_KEY &&
      process.env.APPLE_OAUTH_REDIRECT_URI,
    ),

  buildAuthUrl: ({ state, codeChallenge, redirectUri }) => {
    const clientId = process.env.APPLE_OAUTH_CLIENT_ID;
    if (!clientId) throw new OAuthProviderNotConfiguredError("apple");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      // `name email` asks Apple to include them in the ID token on the very
      // first authorization. Apple does not provide an email scope variant.
      scope: "name email",
      response_mode: "form_post",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return `${APPLE_AUTH_ENDPOINT}?${params.toString()}`;
  },

  exchangeCode: async ({ code, codeVerifier, redirectUri }) => {
    const clientId = process.env.APPLE_OAUTH_CLIENT_ID;
    const teamId = process.env.APPLE_OAUTH_TEAM_ID;
    const keyId = process.env.APPLE_OAUTH_KEY_ID;
    const privateKey = process.env.APPLE_OAUTH_PRIVATE_KEY;

    if (!clientId || !teamId || !keyId || !privateKey) {
      throw new OAuthProviderNotConfiguredError("apple");
    }

    const clientSecret = await buildAppleClientSecret({
      clientId,
      teamId,
      keyId,
      privateKey,
    });

    const response = await fetch(APPLE_TOKEN_ENDPOINT, {
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
      const body = await response.text();
      console.error("Apple token exchange failed", response.status, body);
      throw new OAuthExchangeFailedError(
        "Apple rejected the authorization code",
      );
    }

    const tokens = (await response.json()) as { id_token?: string };
    if (!tokens.id_token) {
      throw new OAuthExchangeFailedError("Apple returned no ID token");
    }

    // Apple signs ID tokens with a key we can verify against its JWKS.
    const { payload } = await jwtVerify(tokens.id_token, APPLE_JWKS, {
      issuer: APPLE_ISSUER,
      audience: clientId,
    });

    if (!payload.sub) throw new OAuthIdTokenInvalidError("Missing subject");
    if (!payload.email || typeof payload.email !== "string") {
      throw new OAuthEmailMissingError();
    }

    // Apple returns `email_verified` as a string on some flows.
    const emailVerified =
      payload.email_verified === true || payload.email_verified === "true";

    if (!emailVerified) throw new OAuthEmailMissingError();

    const info: OAuthUserInfo = {
      providerUserId: payload.sub,
      email: payload.email.toLowerCase(),
      emailVerified: true,
      name: typeof payload.name === "string" ? payload.name : null,
      avatar: null, // Apple never provides a profile picture.
    };

    return info;
  },
};

/**
 * Builds the client secret JWT Apple expects.
 *
 * Why:
 * Apple requires the client secret to be a JWT signed with the developer's
 * ES256 `.p8` key, with a fixed 6-month max lifetime. Generating it on each
 * exchange sidesteps the need to rotate a stored secret and keeps the key
 * on disk only as an environment variable.
 */
async function buildAppleClientSecret(input: {
  clientId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
}): Promise<string> {
  const key = await importPkcs8(input.privateKey);
  const now = Math.floor(Date.now() / 1000);

  return (
    new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: input.keyId })
      .setIssuer(input.teamId)
      .setAudience(APPLE_ISSUER)
      .setSubject(input.clientId)
      .setIssuedAt(now)
      // Apple caps this at 6 months; use 5 minutes so a leaked token has
      // almost no useful lifetime. It is only used for the code exchange
      // immediately after being minted.
      .setExpirationTime(now + 5 * 60)
      .sign(key)
  );
}

/**
 * Imports the `.p8` private key.
 *
 * Why:
 * Apple distributes the key as PEM/PKCS#8. Env vars cannot carry literal
 * newlines reliably, so we accept the common `\n` escape sequence and turn
 * it back into real newlines before decoding.
 */
async function importPkcs8(pem: string): Promise<CryptoKey> {
  const { importPKCS8 } = await import("jose");
  const normalized = pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
  return importPKCS8(normalized, "ES256");
}
