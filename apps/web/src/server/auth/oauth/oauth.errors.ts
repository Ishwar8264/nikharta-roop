/** Thrown when the state cookie is missing, expired, or mismatched. */
export class OAuthStateInvalidError extends Error {
  constructor() {
    super("OAuth state is missing or invalid");
    this.name = "OAuthStateInvalidError";
  }
}

/**
 * Thrown when a state value was minted by one provider but returned on
 * another provider's callback.
 *
 * Why:
 * This is the exact class of bug that CVE-2026-73419 describes in Auth.js.
 * Keeping it as its own typed error makes the issue obvious in logs and
 * impossible to confuse with a normal expiry.
 */
export class OAuthStateProviderMismatchError extends Error {
  constructor() {
    super("OAuth state belongs to a different provider");
    this.name = "OAuthStateProviderMismatchError";
  }
}

/** Thrown when a provider is not configured in the environment. */
export class OAuthProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`OAuth provider "${provider}" is not configured`);
    this.name = "OAuthProviderNotConfiguredError";
  }
}

/** Thrown when the provider's authorization code exchange fails. */
export class OAuthExchangeFailedError extends Error {
  constructor(reason = "Token exchange failed") {
    super(reason);
    this.name = "OAuthExchangeFailedError";
  }
}

/** Thrown when the ID token from a provider fails validation. */
export class OAuthIdTokenInvalidError extends Error {
  constructor(reason = "Provider ID token could not be verified") {
    super(reason);
    this.name = "OAuthIdTokenInvalidError";
  }
}

/** Thrown when a provider's response lacks the email we need for linking. */
export class OAuthEmailMissingError extends Error {
  constructor() {
    super("The provider did not return a verified email address");
    this.name = "OAuthEmailMissingError";
  }
}

/** Thrown when the local user account is soft-deleted. */
export class OAuthAccountDeactivatedError extends Error {
  constructor() {
    super("This account has been deactivated");
    this.name = "OAuthAccountDeactivatedError";
  }
}

/** Thrown when the same email is already linked to a different provider id. */
export class OAuthLinkConflictError extends Error {
  constructor() {
    super("This account is already linked to a different provider identity");
    this.name = "OAuthLinkConflictError";
  }
}

/** Thrown for unknown or unsupported provider ids. */
export class OAuthUnknownProviderError extends Error {
  constructor(id: string) {
    super(`Unknown OAuth provider "${id}"`);
    this.name = "OAuthUnknownProviderError";
  }
}
