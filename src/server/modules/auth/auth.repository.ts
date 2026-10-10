import "server-only";

import { prisma } from "@/lib/prisma";

import type {
  AuthSession,
  CreateUserRecord,
  CurrentUserRecord,
  ExistingIdentifiers,
  LoginUserRecord,
  RegisteredUser,
  UserIdentifiers,
  UserWithPasswordRecord,
} from "./auth.types";

const PUBLIC_USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  createdAt: true,
} as const;

/**
 * Finds an existing account using either supplied unique identifier.
 *
 * Why:
 * This provides a precise conflict message before attempting an insert; the
 * database constraint remains the final protection against concurrent requests.
 */
export async function findExistingIdentifiers(
  identifiers: UserIdentifiers,
): Promise<ExistingIdentifiers | null> {
  const conditions = [
    identifiers.email ? { email: identifiers.email } : undefined,
    identifiers.phone ? { phone: identifiers.phone } : undefined,
  ].filter((condition): condition is NonNullable<typeof condition> =>
    Boolean(condition),
  );

  return prisma.user.findFirst({
    where: { OR: conditions },
    select: { email: true, phone: true },
  });
}

/** Creates a user while selecting only fields safe to return to a client. */
export async function createUser(
  input: CreateUserRecord,
): Promise<RegisteredUser> {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: input.passwordHash,
    },
    select: PUBLIC_USER_FIELDS,
  });
}

// Login

/**
 * Loads a user by email OR phone for login, including the password hash.
 *
 * Why:
 * Registration uses a narrower SELECT (no password). Login needs the hash, so
 * it gets its own select clause rather than widening the shared one.
 */
export async function findUserForLogin(
  identifiers: UserIdentifiers,
): Promise<LoginUserRecord | null> {
  const conditions = [
    identifiers.email ? { email: identifiers.email } : undefined,
    identifiers.phone ? { phone: identifiers.phone } : undefined,
  ].filter((condition): condition is NonNullable<typeof condition> =>
    Boolean(condition),
  );

  if (conditions.length === 0) return null;

  return prisma.user.findFirst({
    where: {
      OR: conditions,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      password: true,
      role: true,
      emailVerified: true,
      phoneVerified: true,
      deletedAt: true,
      createdAt: true,
    },
  });
}

/**
 * Loads a non-deleted user by id with the fields `/me` needs.
 *
 * Why:
 * `/me` returns fresh DB state (role changes, name edits, soft-delete) rather
 * than trusting the JWT payload, which can be up to 15 minutes stale.
 */
export async function findUserById(
  id: string,
): Promise<CurrentUserRecord | null> {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      coverImage: true,
      bio: true,
      lat: true,
      lng: true,
      role: true,
      isOnboarded: true,
      emailVerified: true,
      phoneVerified: true,
      loyaltyPoints: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Loads the user's password hash so the caller can verify a current password.
 *
 * Why:
 * Scoped to just `id` + `password` so the hash cannot accidentally leak into
 * a response. Soft-deleted users are excluded — they have no password to
 * change or confirm.
 */
export async function findUserWithPasswordById(
  userId: string,
): Promise<UserWithPasswordRecord | null> {
  return prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, password: true },
  });
}

/**
 * Applies a partial profile update and returns the canonical current user.
 *
 * Why:
 * The explicit data type prevents protected fields from being written, while
 * the response matches GET `/me` so clients keep one stable user shape.
 */
export async function updateUserProfile(
  userId: string,
  data: {
    name?: string | null;
    avatar?: string | null;
    coverImage?: string | null;
    bio?: string | null;
    lat?: number | null;
    lng?: number | null;
  },
): Promise<CurrentUserRecord> {
  return prisma.user.update({
    where: { id: userId, deletedAt: null },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      coverImage: true,
      bio: true,
      lat: true,
      lng: true,
      role: true,
      isOnboarded: true,
      emailVerified: true,
      phoneVerified: true,
      loyaltyPoints: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/** Lists the user's live refresh sessions without exposing token hashes. */
export async function findActiveSessions(
  userId: string,
): Promise<Omit<AuthSession, "isCurrent">[]> {
  return prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
      user: { deletedAt: null },
    },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Finds a live session by its hash, scoped to the authenticated user. */
export async function findActiveSessionByHash(
  userId: string,
  tokenHash: string,
): Promise<{ id: string } | null> {
  return prisma.refreshToken.findFirst({
    where: {
      userId,
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
}

/** Revokes one live session only when it belongs to the authenticated user. */
export async function revokeActiveSessionById(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const result = await prisma.refreshToken.updateMany({
    where: {
      id: sessionId,
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { revokedAt: new Date() },
  });

  return result.count === 1;
}
