import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { hashPassword } from "@/server/auth/password";

import { createUser, findExistingIdentifiers } from "./auth.repository";
import type {
  LoginUserRecord,
  RegisteredUser,
  RegisterUserInput,
} from "./auth.types";
import { RegistrationConflictError } from "./registration-conflict.error";

// Login

import { verifyPassword } from "@/server/auth/password";
import { issueTokenPair } from "@/server/auth/token.service";

import { EmailNotVerifiedError, InvalidCredentialsError } from "./auth.errors";
import { findUserForLogin } from "./auth.repository";
import type { LoginResult, LoginUserInput } from "./auth.types";

// auth me
import { findUserById } from "./auth.repository";
import type { CurrentUser } from "./auth.types";

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

// Login

/**
 * A precomputed scrypt hash used only when the user is not found.
 *
 * Why:
 * Without this, a missing user returns in ~1ms while a wrong password takes
 * ~100ms. Attackers can measure that gap to enumerate valid emails. Running
 * a dummy verification keeps both paths roughly equal in time.
 *
 * Generated once with hashPassword("dummy-timing-equalizer").
 */
const DUMMY_PASSWORD_HASH =
  "scrypt$N=131072,r=8,p=1$AAAAAAAAAAAAAAAAAAAAAA$" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export interface LoginMetadata {
  userAgent?: string;
  ipAddress?: string;
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

  // If the identifier used is unverified, block login until it is verified.
  if (input.email && !user.emailVerified) {
    throw new EmailNotVerifiedError();
  }
  if (input.phone && !user.phoneVerified) {
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
    role: user.role,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    createdAt: user.createdAt,
  };
}
