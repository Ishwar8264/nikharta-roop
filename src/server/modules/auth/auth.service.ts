import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { hashPassword } from "@/server/auth/password";

import { createUser, findExistingIdentifiers } from "./auth.repository";
import type { RegisteredUser, RegisterUserInput } from "./auth.types";
import { RegistrationConflictError } from "./registration-conflict.error";

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
