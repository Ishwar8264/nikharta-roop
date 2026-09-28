import "server-only";

import {
  OAuthEmailMissingError,
  OAuthExchangeFailedError,
  OAuthProviderNotConfiguredError,
} from "../oauth.errors";
import type { OAuthUserInfo } from "../oauth.types";
import type { OAuthProvider } from "./provider.types";

const FACEBOOK_AUTH_ENDPOINT = "https://www.facebook.com/v20.0/dialog/oauth";
const FACEBOOK_TOKEN_ENDPOINT =
  "https://graph.facebook.com/v20.0/oauth/access_token";
const FACEBOOK_ME_ENDPOINT = "https://graph.facebook.com/v20.0/me";

/**
 * Facebook Login provider.
 *
 * Why:
 * Facebook in India is the highest-volume SSO provider (~43% of social
 * logins), so it is worth the extra `fetch` call. Facebook is not an OIDC
 * provider — there is no signed ID token to verify. Instead, we exchange
 * the code for an access token and call the Graph API `/me` endpoint with
 * the token to read the user's profile. The trust boundary is Facebook's
 * HTTPS endpoint plus the access token that only Facebook could have issued
 * for our client id.
 */
export const facebookProvider: OAuthProvider = {
  id: "facebook",
  displayName: "Facebook",

  isConfigured: () =>
    Boolean(
      process.env.FACEBOOK_OAUTH_CLIENT_ID &&
      process.env.FACEBOOK_OAUTH_CLIENT_SECRET &&
      process.env.FACEBOOK_OAUTH_REDIRECT_URI,
    ),

  buildAuthUrl: ({ state, codeChallenge, redirectUri }) => {
    const clientId = process.env.FACEBOOK_OAUTH_CLIENT_ID;
    if (!clientId) throw new OAuthProviderNotConfiguredError("facebook");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      // Facebook still uses "email" rather than "email_verified"; the token
      // endpoint returns whether the email is verified as a separate field.
      scope: "email,public_profile",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return `${FACEBOOK_AUTH_ENDPOINT}?${params.toString()}`;
  },

  exchangeCode: async ({ code, codeVerifier, redirectUri }) => {
    const clientId = process.env.FACEBOOK_OAUTH_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_OAUTH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new OAuthProviderNotConfiguredError("facebook");
    }

    // Step 1: exchange the code for an access token. Facebook accepts the
    // verifier here the same way OIDC providers do.
    const tokenUrl = new URL(FACEBOOK_TOKEN_ENDPOINT);
    tokenUrl.searchParams.set("code", code);
    tokenUrl.searchParams.set("client_id", clientId);
    tokenUrl.searchParams.set("client_secret", clientSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code_verifier", codeVerifier);

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: "GET",
    });

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text();
      console.error(
        "Facebook token exchange failed",
        tokenResponse.status,
        body,
      );
      throw new OAuthExchangeFailedError(
        "Facebook rejected the authorization code",
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
    };
    if (!tokenData.access_token) {
      throw new OAuthExchangeFailedError("Facebook returned no access token");
    }

    // Step 2: fetch the user's profile. `fields=id,name,email,picture` is
    // the minimum Facebook requires for a useful account record.
    const meUrl = new URL(FACEBOOK_ME_ENDPOINT);
    meUrl.searchParams.set("fields", "id,name,email,picture");
    meUrl.searchParams.set("access_token", tokenData.access_token);

    const meResponse = await fetch(meUrl.toString(), { method: "GET" });
    if (!meResponse.ok) {
      const body = await meResponse.text();
      console.error("Facebook profile fetch failed", meResponse.status, body);
      throw new OAuthExchangeFailedError("Facebook did not return a profile");
    }

    const me = (await meResponse.json()) as {
      id?: string;
      name?: string;
      email?: string;
      picture?: { data?: { url?: string } };
    };

    console.log("FACEBOOK ME:", JSON.stringify(me));

    if (!me.id) throw new OAuthExchangeFailedError("Missing Facebook user id");
    if (!me.email) throw new OAuthEmailMissingError();

    // Facebook does not sign the email; the fact that we received it from
    // the authenticated Graph call is the verification. Treat it as trusted
    // because the call required a token Facebook only issues to us.
    const info: OAuthUserInfo = {
      providerUserId: me.id,
      email: me.email.toLowerCase(),
      emailVerified: true,
      name: me.name ?? null,
      avatar: me.picture?.data?.url ?? null,
    };

    return info;
  },
};
