import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

import { signAccessToken } from "./jwt";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresAt: Date;
}

export interface TokenMetadata {
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Issues a fresh access + refresh token pair for a user.
 *
 * Why:
 * Access tokens are short-lived JWTs so verification needs no DB hit. Refresh
 * tokens are opaque random strings stored as SHA-256 hashes, so a database
 * leak does not expose usable tokens.
 */
export async function issueTokenPair(
  userId: string,
  role: string,
  metadata: TokenMetadata = {},
): Promise<TokenPair> {
  const accessToken = await signAccessToken({ sub: userId, role });

  const refreshToken = randomBytes(40).toString("base64url");
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const refreshTokenExpiresAt = new Date(
    Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000,
  );

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: refreshTokenHash,
      userAgent: metadata.userAgent ?? null,
      ipAddress: metadata.ipAddress ?? null,
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresAt,
  };
}

/**
 * Rotates a refresh token: invalidates the old one and issues a new pair.
 *
 * Why:
 * Rotation means a stolen refresh token can only be used once. If a revoked
 * token is ever presented again, we treat it as theft and revoke every
 * session for that user, forcing a full re-login.
 */
export async function rotateRefreshToken(
  rawRefreshToken: string,
  role: string,
  metadata: TokenMetadata = {},
): Promise<TokenPair | null> {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!stored) return null;

  if (stored.expiresAt < new Date()) {
    return null;
  }

  // Reuse of a revoked token = theft signal. Nuke every session for this user.
  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return null;
  }

  // Mark the old token as revoked, then issue a brand new pair.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueTokenPair(stored.userId, role, metadata);
}

/** Revokes a single refresh token. Safe to call on an already-revoked token. */
export async function revokeRefreshToken(
  rawRefreshToken: string,
): Promise<void> {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Hashes a refresh token so plaintext tokens never touch the database. */
function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
