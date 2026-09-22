import "server-only";

import { createHash, randomBytes } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  ACCESS_TOKEN_TTL_SECONDS,
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
): Promise<TokenPair> {
  const accessToken = await signAccessToken({ sub: userId, role });

  const refreshToken = randomBytes(40).toString("base64url");
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
 * token is ever presented again, we treat it as theft and revoke every
 * session for that user, forcing a full re-login.
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

    // Reuse of a revoked token = theft signal. Nuke every session for this user.
    if (stored.revokedAt) {
      await revokeAllUserTokens(transaction, stored.userId);
      return null;
    }

    const user = await transaction.user.findUnique({
      where: { id: stored.userId },
      select: { role: true, deletedAt: true },
    });

    if (!user || user.deletedAt) return null;

    // Conditional claim is the concurrency boundary: only one request can
    // change this exact active token. A loser is treated as replay.
    const claimed = await transaction.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (claimed.count !== 1) {
      await revokeAllUserTokens(transaction, stored.userId);
      return null;
    }

    return createTokenPair(transaction, stored.userId, user.role, metadata);
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
