// Load the focused unauthorized error shared by protected server boundaries.
import { UnauthorizedError } from "@/src/lib/errors";
// Load token verification and hashing used by database-backed browser sessions.
import {
  hashToken,
  verifyAccessToken,
  verifyRouteSessionToken,
} from "@/src/lib/jwt";
// Load focused session queries without importing unrelated OTP or email services.
import * as authQuery from "@/src/queries/auth/auth.query";

// Describe optional browser proofs accepted by shared server authorization boundaries.
type BrowserSessionInput = {
  // Accept the short-lived access cookie for pre-migration and API-compatible sessions.
  accessToken?: string;
  // Prefer the long-lived signed reference bound to one persisted refresh session.
  sessionHint?: string;
};

// Verify an access JWT and its persisted session for protected endpoints.
export const validateAccessSessionService = async (accessToken: string) => {
  // Verify JWT signature and expiry before reading its claims.
  const decoded = verifyAccessToken(accessToken);

  // Hash the presented token to locate its active database session.
  const hashedToken = hashToken(accessToken);

  // Load a non-revoked and unexpired session with its current account.
  const session = await authQuery.findSessionByAccessToken(hashedToken);

  // Reject missing sessions, mismatched subjects, and blocked or deleted accounts.
  if (
    !session ||
    session.userId !== decoded.userId ||
    !session.user.isActive ||
    session.user.deletedAt
  ) {
    throw new UnauthorizedError("Session expired or revoked");
  }

  // Return the current database role so authorization reflects account updates immediately.
  return { role: session.user.role, userId: session.userId };
};

// Verify a signed page marker against its exact active database refresh session.
export const validateRouteSessionService = async (sessionHint: string) => {
  // Verify marker signature, expiry, purpose, subject, and persisted-session identifier.
  const decoded = verifyRouteSessionToken(sessionHint);

  // Load only the active refresh session bound to this signed marker.
  const session = await authQuery.findSessionByRefreshToken(
    decoded.refreshTokenId,
  );

  // Reject revoked sessions, mismatched subjects, and blocked or deleted accounts.
  if (
    !session ||
    session.userId !== decoded.userId ||
    !session.user.isActive ||
    session.user.deletedAt
  ) {
    throw new UnauthorizedError("Session expired or revoked");
  }

  // Return the current database role only after complete server-side validation.
  return { role: session.user.role, userId: session.userId };
};

// Resolve one current database-backed browser session without leaking validation details.
export const validateBrowserSessionService = async ({
  accessToken,
  sessionHint,
}: BrowserSessionInput) => {
  // Prefer the long-lived route reference because the raw refresh token remains scoped.
  if (sessionHint) {
    try {
      // Verify the signed reference and its exact active refresh session.
      return await validateRouteSessionService(sessionHint);
    } catch {
      // Continue to the access fallback for browser sessions created before marker hardening.
    }
  }

  // Reject requests that provide no remaining server-verifiable session proof.
  if (!accessToken) {
    return null;
  }

  try {
    // Verify the access JWT and its exact active database session.
    return await validateAccessSessionService(accessToken);
  } catch {
    // Fail closed without exposing token, account, or database validation details.
    return null;
  }
};
