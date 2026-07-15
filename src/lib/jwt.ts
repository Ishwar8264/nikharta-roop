// Import jsonwebtoken for JWT generation and verification
import jwt from "jsonwebtoken";
// Import crypto from Node.js standard library for hashing tokens before storing in DB
import crypto from "node:crypto";

import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from "@/src/constants/auth";

// Read a required JWT secret at execution time and fail closed when it is missing.
const getJwtSecret = (
  name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET",
): string => {
  // Read the selected server-only secret from the environment.
  const secret = process.env[name];

  // Reject token operations when secure signing configuration is incomplete.
  if (!secret) {
    throw new Error(`${name} is not configured`);
  }

  // Return the configured secret after validation.
  return secret;
};

/**
 * Generate both Access Token (short-lived) and Refresh Token (long-lived).
 * Access token contains user ID and role for authorization checks.
 * Refresh token is used to get a new access token when it expires.
 */
export const generateTokens = (userId: string, role: string) => {
  // Sign a short-lived access token used by protected API endpoints.
  const accessToken = jwt.sign({ userId, role }, getJwtSecret("JWT_ACCESS_SECRET"), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  // Sign a longer-lived refresh token used only for session rotation.
  const refreshToken = jwt.sign({ userId }, getJwtSecret("JWT_REFRESH_SECRET"), {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  // Return raw tokens only to the caller while the database stores their hashes.
  return { accessToken, refreshToken };
};

/**
 * Hash the raw JWT token before storing it in the database (AuthSession table).
 * This ensures that even if the database is compromised, raw tokens are not exposed.
 * We store the SHA-256 hash of the token instead of the actual token string.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Verify the access token sent by the client.
 * If valid, it decodes and returns the payload (userId and role).
 * If invalid/expired, it will throw an error (caught by middleware).
 */
export const verifyAccessToken = (token: string) => {
  // Verify signature and expiry before trusting authorization claims.
  return jwt.verify(token, getJwtSecret("JWT_ACCESS_SECRET")) as {
    userId: string;
    role: string;
  };
};

/**
 * Verify a refresh token before rotating its matching database session.
 */
export const verifyRefreshToken = (token: string) => {
  // Verify signature and expiry before trusting the refresh-token subject.
  return jwt.verify(token, getJwtSecret("JWT_REFRESH_SECRET")) as {
    userId: string;
  };
};

// Sign a low-privilege marker used only for optimistic private-route checks.
export const generateOptimisticSessionToken = (refreshToken: string) => {
  // Reuse the verified refresh subject without exposing the scoped token to Proxy.
  const { userId } = verifyRefreshToken(refreshToken);

  // Match the marker lifetime with the refresh session it represents optimistically.
  return jwt.sign(
    { purpose: "ROUTE_ACCESS", userId },
    getJwtSecret("JWT_ACCESS_SECRET"),
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  );
};

// Verify the signed marker without treating it as API authorization proof.
export const verifyOptimisticSessionToken = (token: string) => {
  // Validate signature, expiry, and the dedicated low-privilege purpose claim.
  const payload = jwt.verify(token, getJwtSecret("JWT_ACCESS_SECRET")) as {
    purpose?: string;
    userId?: string;
  };

  // Reject valid JWTs that were issued for another authentication purpose.
  if (payload.purpose !== "ROUTE_ACCESS" || !payload.userId) {
    throw new Error("Invalid optimistic session token");
  }

  // Return the trusted marker claims for focused Proxy decisions.
  return { userId: payload.userId };
};
