// Import jsonwebtoken for JWT generation and verification
import jwt from "jsonwebtoken";
// Import crypto from Node.js standard library for hashing tokens before storing in DB
import crypto from "node:crypto";

// Access secret keys from environment variables for security
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

/**
 * Generate both Access Token (short-lived) and Refresh Token (long-lived).
 * Access token contains user ID and role for authorization checks.
 * Refresh token is used to get a new access token when it expires.
 */
export const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign({ userId, role }, ACCESS_SECRET, {
    expiresIn: "1d", // Access token valid for 1 day
  });
  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, {
    expiresIn: "7d", // Refresh token valid for 7 days
  });

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
  return jwt.verify(token, ACCESS_SECRET) as { userId: string; role: string };
};
