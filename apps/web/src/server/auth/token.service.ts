import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";

import type { Prisma } from "@nikharta-roop/db/client";
import { prisma } from "@/lib/prisma";

import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_GRACE_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from "./auth.constants";
import { signAccessToken } from "./jwt";

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
  return createTokenPair(prisma, userId, role, metadata);
}

/** Issues a token pair as part of a larger authentication transaction. */
export async function issueTokenPairInTransaction(
  transaction: Prisma.TransactionClient,
  userId: string,
  role: string,
  metadata: TokenMetadata = {},
): Promise<TokenPair> {
  return createTokenPair(transaction, userId, role, metadata);
}

/** Creates and persists a token pair using the supplied transaction client. */
async function createTokenPair(
  database: Prisma.TransactionClient | typeof prisma,
  userId: string,
  role: string,
  metadata: TokenMetadata,
  refreshToken = randomBytes(40).toString("base64url"),
): Promise<TokenPair> {
  const accessToken = await signAccessToken({ sub: userId, role });

  const refreshTokenHash = hashRefreshToken(refreshToken);
  const refreshTokenExpiresAt = new Date(
    Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000,
  );

  await database.refreshToken.create({
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
 * token is presented again after the retry window, we revoke every session.
 * Within the window, only its exact live successor can be recovered.
 *
 * The role is loaded from the database (not trusted from the caller) so a
 * user whose role changed cannot keep an old role in their access token.
 */
export async function rotateRefreshToken(
  rawRefreshToken: string,
  metadata: TokenMetadata = {},
): Promise<TokenPair | null> {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  return prisma.$transaction(async (transaction) => {
    const stored = await transaction.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.expiresAt <= new Date()) return null;

    // Derive the exact successor without persisting plaintext credentials.
    // A database dump alone cannot reconstruct it without the signing secret.
    const replacementToken = deriveReplacementToken(rawRefreshToken);
    if (stored.revokedAt) {
      return recoverRotation(transaction, stored, replacementToken);
    }

    const user = await transaction.user.findUnique({
      where: { id: stored.userId },
      select: { role: true, deletedAt: true },
    });

    if (!user || user.deletedAt) return null;

    // Conditional claim is the concurrency boundary: only one request can
    // change this exact active token. A loser recovers the committed successor.
    const claimed = await transaction.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (claimed.count !== 1) {
      // Under READ COMMITTED, re-read after the winning update commits.
      const latest = await transaction.refreshToken.findUnique({
        where: { tokenHash },
      });
      return latest?.revokedAt
        ? recoverRotation(transaction, latest, replacementToken)
        : null;
    }

    return createTokenPair(
      transaction, stored.userId, user.role, metadata, replacementToken,
    );
  });
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
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Revokes every live refresh token for a user inside the current transaction. */
async function revokeAllUserTokens(
  transaction: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  await transaction.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Domain separation keeps refresh derivation distinct from JWT signatures. */
function deriveReplacementToken(rawToken: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT_SECRET must contain at least 32 bytes");
  }
  return createHmac("sha256", secret)
    .update("nikharta-roop:refresh-rotation:v1\0")
    .update(rawToken)
    .digest("base64url");
}

/** Recovers a committed rotation; logout and password revocations stay final. */
async function recoverRotation(
  transaction: Prisma.TransactionClient,
  stored: { userId: string; revokedAt: Date | null },
  replacementToken: string,
): Promise<TokenPair | null> {
  if (!stored.revokedAt) return null;
  const elapsed = Date.now() - stored.revokedAt.getTime();
  if (elapsed < 0 || elapsed > REFRESH_GRACE_SECONDS * 1000) {
    await revokeAllUserTokens(transaction, stored.userId);
    return null;
  }

  const replacement = await transaction.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(replacementToken) },
  });
  if (
    !replacement ||
    replacement.userId !== stored.userId ||
    replacement.revokedAt ||
    replacement.expiresAt <= new Date()
  ) {
    return null;
  }
  const user = await transaction.user.findUnique({
    where: { id: stored.userId },
    select: { role: true, deletedAt: true },
  });
  if (!user || user.deletedAt) return null;

  return {
    accessToken: await signAccessToken({ sub: stored.userId, role: user.role }),
    refreshToken: replacementToken,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresAt: replacement.expiresAt,
  };
}
