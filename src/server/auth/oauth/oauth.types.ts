import "server-only";

import type { PlatformRole } from "@/generated/prisma/client";

/**
 * The set of external identity providers this platform supports.
 *
 * Why:
 * Kept as a closed union so every `switch` over a provider id is exhaustive
 * at compile time. Adding a new provider is a one-line change here followed
 * by a new file in `./providers`.
 */
export type OAuthProviderId = "google" | "apple" | "facebook";

/**
 * Normalized user record returned by every provider.
 *
 * Why:
 * Providers return wildly different payload shapes. Each `exchangeCode`
 * implementation is responsible for narrowing its own response into this
 * shape so the service layer never branches on which provider produced it.
 */
export interface OAuthUserInfo {
  providerUserId: string;
  /** Some providers legitimately omit email; their stable subject remains usable. */
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  avatar: string | null;
}

/** Result of a successful OAuth flow after account creation or linking. */
export interface OAuthLoginResult {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
    role: PlatformRole;
    isOnboarded: boolean;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresAt: Date;
  /** True when the flow created a brand-new user. */
  isNewUser: boolean;
}
