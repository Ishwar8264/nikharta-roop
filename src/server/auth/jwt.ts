import "server-only";

import { randomUUID } from "node:crypto";

import { SignJWT, jwtVerify } from "jose";

const ISSUER = "salon-app";
const AUDIENCE = "salon-app-client";
const ACCESS_TOKEN_TTL = "15m";
const MINIMUM_SECRET_BYTES = 32;
const ALLOWED_ROLES = new Set(["SUPER_ADMIN", "USER"]);

const configuredSecret = process.env.JWT_SECRET;

if (!configuredSecret) {
  throw new Error("JWT_SECRET is not configured");
}

if (Buffer.byteLength(configuredSecret, "utf8") < MINIMUM_SECRET_BYTES) {
  throw new Error("JWT_SECRET must contain at least 32 bytes");
}

const secret = new TextEncoder().encode(configuredSecret);

/**
 * The only claims we trust from an access token.
 *
 * Why:
 * Keeping this minimal means even if a token leaks, it exposes no PII — just
 * a user id and role. `jti` is a unique per-token id used for audit traces
 * without storing the token itself. It is optional on verify to keep old
 * tokens (issued before jti) valid during the rollout.
 */
export interface AccessTokenPayload {
  sub: string;
  role: string;
  /** Unique token id — present on tokens issued after the jti rollout. */
  jti?: string;
}

/**
 * Signs a short-lived access token for a user.
 *
 * Why:
 * `jose` is used instead of `jsonwebtoken` because it runs in both Node.js
 * and the Edge runtime, which keeps middleware verification compatible. Each
 * token carries a `jti` so logs can correlate a request to a single issuance
 * without ever persisting the raw token.
 */
export async function signAccessToken(
  payload: AccessTokenPayload,
): Promise<string> {
  const jti = payload.jti ?? randomUUID();
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .setJti(jti)
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

  if (
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    typeof payload.role !== "string" ||
    !ALLOWED_ROLES.has(payload.role)
  ) {
    throw new Error("Access token contains invalid claims");
  }

  return {
    sub: payload.sub,
    role: payload.role,
    // jti is optional: tokens issued before the rollout lack it — still valid.
    jti: typeof payload.jti === "string" ? payload.jti : undefined,
  };
}
