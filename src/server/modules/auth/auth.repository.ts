import "server-only";

import { prisma } from "@/lib/prisma";

import type {
  CreateUserRecord,
  CurrentUserRecord,
  ExistingIdentifiers,
  LoginUserRecord,
  RegisteredUser,
  UserIdentifiers,
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
      deletedAt: null,
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
      role: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: true,
    },
  });
}
