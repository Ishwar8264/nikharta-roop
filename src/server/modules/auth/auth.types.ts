import type { z } from "zod";

import type {
  changePasswordSchema,
  deleteAccountSchema,
  loginUserSchema,
  registerUserSchema,
  updateProfileSchema,
} from "./auth.schema";
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
  deletedAt: Date | null;
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
  avatar: string | null;
  coverImage: string | null;
  bio: string | null;
  lat: number | null;
  lng: number | null;
  role: string;
  isOnboarded: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Repository row used to build a CurrentUser. */
export type CurrentUserRecord = CurrentUser;

/** Metadata captured when a session is created. */
export interface LoginMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

/** Repository row used to verify the current password before a change. */
export interface UserWithPasswordRecord {
  id: string;
  password: string | null;
}

/** Shape returned after a successful profile update. */
export interface AuthSession {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}
