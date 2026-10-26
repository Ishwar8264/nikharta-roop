import "server-only";

import { createHash, randomBytes } from "node:crypto";

import {
  OAuthStateInvalidError,
  OAuthStateProviderMismatchError,
  OAuthUnknownProviderError,
} from "./oauth.errors";
import type { OAuthProviderId } from "./oauth.types";

/** Length of the random suffix appended to the provider prefix. */
const STATE_RANDOM_BYTES = 32;

/** PKCE code verifier per RFC 7636 requires 43–128 base64url chars. */
const PKCE_VERIFIER_BYTES = 32;

const KNOWN_PROVIDERS: ReadonlySet<string> = new Set([
  "google",
  "apple",
  "facebook",
]);

/**
 * Builds a state value bound to a specific provider.
 *
 * Why:
 * CVE-2026-73419 in Auth.js showed the danger of a state that is not tied
 * to the provider that created it: a state minted for Google could satisfy
 * an Apple callback and allow account linking hijack. Encoding the provider
 * id as a prefix forces every callback to prove it was started by the same
 * provider, which `verifyState` below enforces.
 */
export function generateState(provider: OAuthProviderId): string {
  const random = randomBytes(STATE_RANDOM_BYTES).toString("base64url");
  return `${provider}:${random}`;
}

/**
 * Verifies a state value's provider prefix.
 *
 * Why:
 * The whole point of the bound state is that a Google-start cannot finish an
 * Apple callback. This check is where that invariant is enforced. A missing
 * prefix or a mismatched one raises a distinct error so the failure mode is
 * obvious in logs.
 */
export function verifyStateProvider(
  state: string,
  expectedProvider: OAuthProviderId,
): void {
  if (!state || typeof state !== "string") {
    throw new OAuthStateInvalidError();
  }

  const colonIndex = state.indexOf(":");
  if (colonIndex === -1) {
    throw new OAuthStateInvalidError();
  }

  const provider = state.slice(0, colonIndex);
  if (!KNOWN_PROVIDERS.has(provider)) {
    throw new OAuthUnknownProviderError(provider);
  }

  if (provider !== expectedProvider) {
    throw new OAuthStateProviderMismatchError();
  }
}

/**
 * Generates a PKCE code verifier.
 *
 * Why:
 * PKCE makes the authorization code useless to anyone who intercepts it —
 * the exchange requires the verifier, which never leaves the server. OAuth
 * 2.1 mandates PKCE for all clients, not just public ones.
 */
export function generatePkceVerifier(): string {
  return randomBytes(PKCE_VERIFIER_BYTES).toString("base64url");
}

/**
 * Derives the S256 code challenge from a verifier.
 *
 * Why:
 * The challenge is what travels in the authorization URL and what the
 * provider stores alongside the code. Only the verifier can produce it, so
 * only the server that started the flow can complete the exchange.
 */
export function derivePkceChallenge(verifier: string): string {
  const hash = createHash("sha256").update(verifier).digest();
  return hash.toString("base64url");
}
