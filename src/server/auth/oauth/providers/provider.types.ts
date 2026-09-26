import "server-only";

import type { OAuthProviderId, OAuthUserInfo } from "../oauth.types";

/**
 * Contract every OAuth provider implements.
 *
 * Why:
 * The service layer calls this interface only — it never knows whether the
 * provider uses OIDC with signed ID tokens (Google, Apple) or a plain
 * access-token + profile-fetch dance (Facebook). `isConfigured` lets the
 * app ship with stubs for providers whose credentials are not yet in the
 * environment, and `exchangeCode` is the single point where each provider's
 * response shape is narrowed into `OAuthUserInfo`.
 */
export interface OAuthProvider {
  /** Provider id used in URLs, state prefixes, and the registry. */
  id: OAuthProviderId;
  /** Human-readable name for error messages. */
  displayName: string;
  /** True when the environment has everything needed to complete a flow. */
  isConfigured: () => boolean;

  /**
   * Builds the URL the user is redirected to for authentication.
   *
   * The `state` parameter is the value returned by `generateState()` in
   * `oauth.state.ts`; the `codeChallenge` is the S256 derivation of the
   * verifier the server will hold onto until the callback.
   */
  buildAuthUrl: (input: {
    state: string;
    codeChallenge: string;
    redirectUri: string;
  }) => string;

  /**
   * Exchanges an authorization code for a normalized user record.
   *
   * The implementation performs whatever verification is required for its
   * provider (ID token signature for Google/Apple, profile API call for
   * Facebook) and returns a single `OAuthUserInfo`. Throwing a typed error
   * here bubbles up to the service layer.
   */
  exchangeCode: (input: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }) => Promise<OAuthUserInfo>;
}
