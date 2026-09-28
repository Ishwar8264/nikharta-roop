import "server-only";

import type { PlatformRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import type { OAuthProviderId } from "./oauth.types";

/**
 * Shape returned to the service layer after a successful find-or-create.
 *
 * Why:
 * The service only needs identity and role — everything else is either
 * already handled by the token service or not needed for the response. A
 * narrow shape keeps the query cheap and the contract obvious.
 */
export interface OAuthUserRecord {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  role: PlatformRole;
  isOnboarded: boolean;
  emailVerified: boolean;
  deletedAt: Date | null;
}

/** Loads a non-deleted user by id. */
export async function findUserById(
  id: string,
): Promise<OAuthUserRecord | null> {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      isOnboarded: true,
      emailVerified: true,
      deletedAt: true,
    },
  });
}

/**
 * Loads a non-deleted user by email.
 *
 * Why:
 * Auto-linking a new social identity to an existing account requires a
 * lookup by email. The email column has a unique index so this is a single
 * row read.
 */
export async function findUserByEmail(
  email: string,
): Promise<OAuthUserRecord | null> {
  return prisma.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      isOnboarded: true,
      emailVerified: true,
      deletedAt: true,
    },
  });
}

/**
 * Finds a SocialAccount by provider + provider user id.
 *
 * Why:
 * The provider user id (Google `sub`, Apple `sub`, Facebook id) is the
 * stable identifier for a given external identity. If a row exists, the
 * user has logged in with this provider before — we only need to load the
 * linked User and issue tokens.
 */
export async function findSocialAccountByProvider(input: {
  provider: OAuthProviderId;
  providerUserId: string;
}): Promise<{ id: string; userId: string } | null> {
  return prisma.socialAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: input.provider,
        providerUserId: input.providerUserId,
      },
    },
    select: { id: true, userId: true },
  });
}

/**
 * Links a new social identity to an existing user.
 *
 * Why:
 * When the provider's verified email matches an existing local account,
 * the user is the same person. Adding a SocialAccount row lets future
 * logins through that provider find them without re-checking the email.
 *
 * The unique constraint on (provider, providerUserId) makes this a no-op
 * if the link already exists, which is the case if two concurrent requests
 * race to create it.
 */
export async function linkSocialAccount(input: {
  userId: string;
  provider: OAuthProviderId;
  providerUserId: string;
}): Promise<void> {
  await prisma.socialAccount.upsert({
    where: {
      provider_providerUserId: {
        provider: input.provider,
        providerUserId: input.providerUserId,
      },
    },
    update: {},
    create: {
      userId: input.userId,
      provider: input.provider,
      providerUserId: input.providerUserId,
    },
  });
}

/**
 * Creates a new user from a social provider's verified profile.
 *
 * Why:
 * A first-time OAuth login has no local password. The user is created with
 * `password: null`, `emailVerified: true` (the provider already proved the
 * address), and `isOnboarded: false` so the UI can prompt for a phone
 * number or profile details after the first sign-in.
 */
export async function createOAuthUser(input: {
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  avatar: string | null;
}): Promise<OAuthUserRecord> {
  return prisma.user.create({
    data: {
      email: input.email?.toLowerCase() ?? null,
      name: input.name,
      avatar: input.avatar,
      // No password — this account can only be accessed via the provider
      // until the user sets one through the password-change flow.
      password: null,
      emailVerified: input.emailVerified,
      isOnboarded: false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      isOnboarded: true,
      emailVerified: true,
      deletedAt: true,
    },
  });
}

/**
 * Backfills a missing avatar or name on an existing user.
 *
 * Why:
 * When a user signs in with a provider for the first time after having
 * been created by a different method (e.g. email + password), their
 * profile may have no avatar or name. The provider is a trustworthy
 * source for these fields, so we fill them in only when the local value
 * is missing — never overwriting a user's own edits.
 */
export async function backfillUserProfile(input: {
  userId: string;
  name: string | null;
  avatar: string | null;
}): Promise<void> {
  const current = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { name: true, avatar: true },
  });
  if (!current) return;

  const data: Record<string, unknown> = {};
  if (!current.name && input.name) data.name = input.name;
  if (!current.avatar && input.avatar) data.avatar = input.avatar;

  if (Object.keys(data).length === 0) return;
  await prisma.user.update({ where: { id: input.userId }, data });
}
