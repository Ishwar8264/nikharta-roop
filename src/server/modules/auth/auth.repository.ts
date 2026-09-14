import "server-only";

import { prisma } from "@/lib/prisma";

import type {
  CreateUserRecord,
  ExistingIdentifiers,
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
