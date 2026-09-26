import "server-only";

import { OAuthUnknownProviderError } from "../oauth.errors";
import type { OAuthProviderId } from "../oauth.types";
import { appleProvider } from "./apple.provider";
import { facebookProvider } from "./facebook.provider";
import { googleProvider } from "./google.provider";
import type { OAuthProvider } from "./provider.types";

/**
 * Registry of every supported OAuth provider.
 *
 * Why:
 * The route handlers and the service layer resolve providers by id through
 * this map. Adding a new provider means writing its file and adding one line
 * here — no other code changes required.
 */
const REGISTRY: Record<OAuthProviderId, OAuthProvider> = {
  google: googleProvider,
  apple: appleProvider,
  facebook: facebookProvider,
};

/**
 * Returns the provider implementation for an id.
 *
 * Throws a typed error for ids that are not in the registry so a
 * misconfigured URL fails fast with a clear message rather than an
 * `undefined is not a function` deep inside the flow.
 */
export function getOAuthProvider(id: string): OAuthProvider {
  if (!(id in REGISTRY)) {
    throw new OAuthUnknownProviderError(id);
  }
  return REGISTRY[id as OAuthProviderId];
}

/** Lists every provider known to the app, for the login UI to consume. */
export function listOAuthProviders(): Array<{
  id: OAuthProviderId;
  displayName: string;
  configured: boolean;
}> {
  return Object.values(REGISTRY).map((provider) => ({
    id: provider.id,
    displayName: provider.displayName,
    configured: provider.isConfigured(),
  }));
}

export { appleProvider, facebookProvider, googleProvider };
export type { OAuthProvider };
