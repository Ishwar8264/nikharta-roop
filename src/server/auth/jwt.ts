import "server-only";

import { SignJWT, jwtVerify } from "jose";

const ISSUER = "salon-app";
const AUDIENCE = "salon-app-client";
const ACCESS_TOKEN_TTL = "15m";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

/**
 * The only claims we trust from an access token.
 *
 * Why:
 * Keeping this minimal means even if a token leaks, it exposes no PII — just
 * a user id and role. Anything else must be fetched from the database.
 */
export interface AccessTokenPayload {
  sub: string;
  role: string;
}

/**
 * Signs a short-lived access token for a user.
 *
 * Why:
 * `jose` is used instead of `jsonwebtoken` because it runs in both Node.js
 * and the Edge runtime, which keeps middleware verification compatible.
 */
export async function signAccessToken(
  payload: AccessTokenPayload,
): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(secret);
}

/**
 * Verifies an access token and returns its trusted claims.
 *
 * Why:
 * Pinning the algorithm, issuer, and audience closes algorithm-confusion and
 * token-replay-from-another-service classes of attack in a single call.
 *
 * Throws if the token is expired, tampered with, or not issued by us.
 */
export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  return {
    sub: String(payload.sub),
    role: String(payload.role),
  };
}
