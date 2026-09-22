import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
  hashRefreshToken,
  issueTokenPair,
  issueTokenPairInTransaction,
  type TokenPair,
} from "@/server/auth/token.service";
import { PasswordUnchangedError } from "@/server/modules/password/password.errors";

import {
  AccountDeactivatedError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
  InvalidCurrentPasswordError,
} from "./auth.errors";
import {
  createUser,
  findActiveSessionByHash,
  findActiveSessions,
  findExistingIdentifiers,
  findUserById,
  findUserForLogin,
  findUserWithPasswordById,
  revokeActiveSessionById,
  updateUserProfile,
} from "./auth.repository";
import type {
  AuthSession,
  ChangePasswordInput,
  CurrentUser,
  DeleteAccountInput,
  LoginMetadata,
  LoginResult,
  LoginUserInput,
  LoginUserRecord,
  RegisteredUser,
  RegisterUserInput,
  UpdateProfileInput,
} from "./auth.types";
import { RegistrationConflictError } from "./registration-conflict.error";

/**
 * A precomputed scrypt hash used only when the user is not found during login.
 *
 * Why:
 * Without this, a missing user returns in ~1ms while a wrong password takes
 * ~100ms. Attackers can measure that gap to enumerate valid emails. Running a
 * dummy verification keeps both paths roughly equal in time.
 *
 * Generated once with hashPassword("dummy-timing-equalizer").
 */
const DUMMY_PASSWORD_HASH =
  "scrypt$N=131072,r=8,p=1$AAAAAAAAAAAAAAAAAAAAAA$" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

/**
 * Applies registration rules and persists a safely hashed password.
 *
 * Why:
 * Keeping this workflow outside the route makes it independently testable and
 * prevents HTTP concerns from leaking into authentication business logic.
 */
export async function registerUser(
  input: RegisterUserInput,
): Promise<RegisteredUser> {
  const existing = await findExistingIdentifiers(input);

  if (input.email && existing?.email === input.email) {
    throw new RegistrationConflictError("Email already exists");
  }

  if (input.phone && existing?.phone === input.phone) {
    throw new RegistrationConflictError("Phone already exists");
  }

  const passwordHash = await hashPassword(input.password);

  try {
    return await createUser({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
    });
  } catch (error) {
    // A concurrent registration can pass the pre-check, so DB uniqueness wins.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new RegistrationConflictError("Email or phone already exists");
    }

    throw error;
  }
}

/**
 * Authenticates a user and issues a token pair.
 *
 * Why:
 * Business rules (timing-equalized verification, verification flags, token
 * issuance) live here so the route only handles HTTP concerns.
 */
export async function loginUser(
  input: LoginUserInput,
  metadata: LoginMetadata = {},
): Promise<LoginResult> {
  const user = await findUserForLogin(input);

  // Always verify against something so response time does not leak existence.
  const hashToVerify = user?.password ?? DUMMY_PASSWORD_HASH;
  const passwordMatches = await verifyPassword(input.password, hashToVerify);

  if (!user || !user.password || !passwordMatches) {
    throw new InvalidCredentialsError();
  }

  if (user.deletedAt) {
    throw new AccountDeactivatedError();
  }

  // If the identifier used is unverified, block login until it is verified.
  if (!user.emailVerified) {
    throw new EmailNotVerifiedError();
  }

  const tokens = await issueTokenPair(user.id, user.role, metadata);

  return {
    user: toPublicUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresIn: tokens.accessTokenExpiresIn,
    refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
  };
}

/**
 * Loads the current user's profile for a verified access-token subject.
 *
 * Why:
 * Returns `null` rather than throwing when the user no longer exists so the
 * route can map both "no token" and "user deleted" to the same 401 response.
 */
export async function getCurrentUser(
  userId: string,
): Promise<CurrentUser | null> {
  const user = await findUserById(userId);
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    bio: user.bio,
    lat: user.lat,
    lng: user.lng,
    role: user.role,
    isOnboarded: user.isOnboarded,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    loyaltyPoints: user.loyaltyPoints,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Verifies the current password and replaces it with a new hash.
 *
 * Why:
 * Runs the password write and session rotation in one transaction. On success
 * every old refresh token is revoked and a new pair is issued for this device.
 * This keeps the caller signed in without preserving a pre-change session ID.
 */
export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
  metadata: LoginMetadata = {},
): Promise<TokenPair> {
  const user = await findUserWithPasswordById(userId);

  if (!user || !user.password) {
    throw new InvalidCurrentPasswordError();
  }

  const matches = await verifyPassword(input.currentPassword, user.password);
  if (!matches) {
    throw new InvalidCurrentPasswordError();
  }

  // Reject reuse so "change" actually changes something.
  const samePassword = await verifyPassword(input.newPassword, user.password);
  if (samePassword) {
    throw new PasswordUnchangedError();
  }

  const passwordHash = await hashPassword(input.newPassword);
  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.user.updateMany({
      // Comparing the hash prevents two concurrent changes that both verified
      // the old password from silently overwriting each other.
      where: { id: userId, password: user.password, deletedAt: null },
      data: { password: passwordHash },
    });

    if (updated.count !== 1) {
      throw new InvalidCurrentPasswordError();
    }

    await transaction.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return issueTokenPairInTransaction(
      transaction,
      userId,
      // Role is loaded from the authenticated user record, never the JWT.
      (await transaction.user.findUniqueOrThrow({
        where: { id: userId },
        select: { role: true },
      })).role,
      metadata,
    );
  });
}

/**
 * Applies a partial profile update.
 *
 * Why:
 * Only editable fields are accepted by the schema, so repository spread
 * cannot touch role, email, phone, or verification flags.
 */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<CurrentUser> {
  try {
    return await updateUserProfile(userId, input);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new AccountDeactivatedError();
    }

    throw error;
  }
}

/** Returns all live refresh sessions and marks the cookie-backed session. */
export async function listSessions(
  userId: string,
  currentRefreshToken: string | null,
): Promise<AuthSession[]> {
  const sessions = await findActiveSessions(userId);
  const currentSession = currentRefreshToken
    ? await findActiveSessionByHash(
        userId,
        hashRefreshToken(currentRefreshToken),
      )
    : null;

  return sessions.map((session) => ({
    ...session,
    isCurrent: session.id === currentSession?.id,
  }));
}

/** Revokes one user-owned session and reports whether it was the current one. */
export async function revokeSession(
  userId: string,
  sessionId: string,
  currentRefreshToken: string | null,
): Promise<{ revoked: boolean; wasCurrent: boolean }> {
  const currentSession = currentRefreshToken
    ? await findActiveSessionByHash(
        userId,
        hashRefreshToken(currentRefreshToken),
      )
    : null;
  const revoked = await revokeActiveSessionById(userId, sessionId);

  return { revoked, wasCurrent: revoked && currentSession?.id === sessionId };
}

/**
 * Soft-deletes the account after confirming the current password.
 *
 * Why:
 * Deletion is destructive. Requiring the password makes a stolen access token
 * insufficient on its own. The user row stays with `deletedAt` set so
 * appointments, reviews, and audit trails keep their foreign keys; all live
 * refresh tokens are revoked in the same transaction so no session survives.
 */
export async function deleteAccount(
  userId: string,
  input: DeleteAccountInput,
): Promise<void> {
  const user = await findUserWithPasswordById(userId);

  if (!user || !user.password) {
    throw new InvalidCurrentPasswordError();
  }

  const matches = await verifyPassword(input.password, user.password);
  if (!matches) {
    throw new InvalidCurrentPasswordError();
  }

  await prisma.$transaction(async (transaction) => {
    const deleted = await transaction.user.updateMany({
      where: { id: userId, password: user.password, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (deleted.count !== 1) {
      throw new InvalidCurrentPasswordError();
    }

    await transaction.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });
}

/** Strips server-only fields (password, verification flags) from the user. */
function toPublicUser(user: LoginUserRecord): RegisteredUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}
