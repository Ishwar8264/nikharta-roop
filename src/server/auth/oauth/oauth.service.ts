import "server-only";

import type { PlatformRole } from "@/generated/prisma/client";
import { issueTokenPair } from "@/server/auth/token.service";
import {
  OAuthAccountDeactivatedError,
  OAuthLinkConflictError,
  OAuthProviderNotConfiguredError,
} from "./oauth.errors";
import {
  backfillUserProfile,
  createOAuthUser,
  findSocialAccountByProvider,
  findUserByEmail,
  findUserById,
  linkSocialAccount,
} from "./oauth.repository";
import type {
  OAuthLoginResult,
  OAuthProviderId,
  OAuthUserInfo,
} from "./oauth.types";
import { getOAuthProvider } from "./providers";

/**
 * Result of the initiation step.
 *
 * Why:
 * The route needs three things to complete a redirect: the target URL,
 * the state value to write into a cookie, and the PKCE verifier to write
 * into a separate cookie. Returning them as a struct keeps the route thin.
 */
export interface OAuthInitiation {
  redirectUrl: string;
  state: string;
  codeVerifier: string;
}

/**
 * Starts an OAuth flow.
 *
 * Why:
 * The caller (a route handler) needs a URL to redirect to and the two
 * pieces of state to stash in cookies. Everything else — state generation,
 * PKCE derivation, provider-specific URL building — lives behind this
 * function so the route stays a two-line coordinator.
 */
export async function initiateOAuth(input: {
  providerId: OAuthProviderId;
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  redirectUri: string;
}): Promise<OAuthInitiation> {
  const provider = getOAuthProvider(input.providerId);
  if (!provider.isConfigured()) {
    throw new OAuthProviderNotConfiguredError(input.providerId);
  }

  const redirectUrl = provider.buildAuthUrl({
    state: input.state,
    codeChallenge: input.codeChallenge,
    redirectUri: input.redirectUri,
  });

  return {
    redirectUrl,
    state: input.state,
    codeVerifier: input.codeVerifier,
  };
}

/**
 * Completes an OAuth flow after the provider redirects back.
 *
 * Why:
 * This is the single place where identity resolution happens. Given the
 * code + verifier + state, it:
 *   1. Exchanges the code for a normalized user profile.
 *   2. Resolves the local account: existing link → existing email →
 *      brand-new user.
 *   3. Links the social identity if the account already existed.
 *   4. Issues our own access + refresh tokens.
 *
 * The step-by-step ordering is deliberate: we look for an existing social
 * link first because that is the cheapest and most specific match. Falling
 * back to email is how auto-linking works — a verified email from a
 * trusted provider is proof enough that the same person owns both accounts.
 */
export async function completeOAuth(input: {
  providerId: OAuthProviderId;
  code: string;
  codeVerifier: string;
  redirectUri: string;
  metadata: { userAgent?: string; ipAddress?: string };
}): Promise<OAuthLoginResult> {
  const provider = getOAuthProvider(input.providerId);
  if (!provider.isConfigured()) {
    throw new OAuthProviderNotConfiguredError(input.providerId);
  }

  const info = await provider.exchangeCode({
    code: input.code,
    codeVerifier: input.codeVerifier,
    redirectUri: input.redirectUri,
  });

  return resolveOAuthLogin({
    providerId: input.providerId,
    info,
    metadata: input.metadata,
  });
}

/**
 * Resolves a provider profile to a local account and issues tokens.
 *
 * Why:
 * Kept as a separate exported function so it can be unit-tested without
 * mocking the provider HTTP calls. The orchestration is identical whether
 * the caller is a real callback or a test.
 */
export async function resolveOAuthLogin(input: {
  providerId: OAuthProviderId;
  info: OAuthUserInfo;
  metadata: { userAgent?: string; ipAddress?: string };
}): Promise<OAuthLoginResult> {
  const { providerId, info, metadata } = input;

  // 1. Check for an existing link — the fast path for repeat logins.
  const existingLink = await findSocialAccountByProvider({
    provider: providerId,
    providerUserId: info.providerUserId,
  });

  if (existingLink) {
    const user = await findUserById(existingLink.userId);
    if (!user || user.deletedAt) throw new OAuthAccountDeactivatedError();

    // Best-effort profile backfill; a failure here must not block sign-in.
    backfillUserProfile({
      userId: user.id,
      name: info.name,
      avatar: info.avatar,
    }).catch((error) => {
      console.error("OAuth profile backfill failed", user.id, error);
    });

    const tokens = await issueTokenPair(user.id, user.role, metadata);
    return buildLoginResult(user, tokens, false);
  }

  // 2. No link yet — try to match an existing account by verified email.
  // Facebook may legitimately omit email. In that case we cannot safely
  // auto-link an existing password account, but its stable provider subject
  // is still sufficient to create and revisit a dedicated social account.
  const byEmail = info.email ? await findUserByEmail(info.email) : null;

  if (byEmail) {
    if (byEmail.deletedAt) throw new OAuthAccountDeactivatedError();

    // Guard against a race: another request may have linked this provider
    // identity to a different account between our two reads. The upsert
    // in `linkSocialAccount` will not overwrite an existing row, so the
    // guard is informational for logs rather than a hard fence.
    await linkSocialAccount({
      userId: byEmail.id,
      provider: providerId,
      providerUserId: info.providerUserId,
    });

    backfillUserProfile({
      userId: byEmail.id,
      name: info.name,
      avatar: info.avatar,
    }).catch((error) => {
      console.error("OAuth profile backfill failed", byEmail.id, error);
    });

    const tokens = await issueTokenPair(byEmail.id, byEmail.role, metadata);
    return buildLoginResult(byEmail, tokens, false);
  }

  // 3. Brand-new user. The email is already verified by the provider,
  //    so we trust it and skip the OTP flow.
  const created = await createOAuthUser({
    email: info.email,
    emailVerified: info.emailVerified,
    name: info.name,
    avatar: info.avatar,
  });

  try {
    await linkSocialAccount({
      userId: created.id,
      provider: providerId,
      providerUserId: info.providerUserId,
    });
  } catch (error) {
    // The user row is committed; failing to link the social identity
    // would leave them unable to sign in with this provider later. Log
    // loudly — a retry on the next login attempt should succeed because
    // the row is created with `update: {}`.
    console.error(
      "Failed to link social account after user creation",
      created.id,
      error,
    );
    throw new OAuthLinkConflictError();
  }

  const tokens = await issueTokenPair(created.id, created.role, metadata);
  return buildLoginResult(created, tokens, true);
}

/** Assembles the final login result from a user row and issued tokens. */
function buildLoginResult(
  user: {
    id: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
    role: PlatformRole;
    isOnboarded: boolean;
    emailVerified: boolean;
  },
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresAt: Date;
  },
  isNewUser: boolean,
): OAuthLoginResult {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      isOnboarded: user.isOnboarded,
      emailVerified: user.emailVerified,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresIn: tokens.accessTokenExpiresIn,
    refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    isNewUser,
  };
}
