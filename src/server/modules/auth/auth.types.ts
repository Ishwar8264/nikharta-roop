import type { z } from "zod";

import type { loginUserSchema, registerUserSchema } from "./auth.schema";

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;

export interface UserIdentifiers {
  email?: string;
  phone?: string;
}

export interface ExistingIdentifiers {
  email: string | null;
  phone: string | null;
}

export interface CreateUserRecord extends UserIdentifiers {
  name: string;
  passwordHash: string;
}

export interface RegisteredUser extends ExistingIdentifiers {
  id: string;
  name: string | null;
  createdAt: Date;
}

// Login

/** The user record the repository returns for password verification. */
export interface LoginUserRecord {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  password: string | null;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
}

/** Shape returned to the route after a successful login. */
export interface LoginResult {
  user: RegisteredUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresAt: Date;
}

/** Full user shape returned by GET /api/v1/auth/me. */
export interface CurrentUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
}

/** Repository row used to build a CurrentUser. */
export type CurrentUserRecord = CurrentUser;
