/**
 * Authentication data access layer.
 * All direct Prisma calls stay here so routes and services remain focused.
 */

import {
  AuthOtpChannel,
  AuthOtpPurpose,
  Prisma,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

// Build one reusable database filter for a normalized mobile or email identity.
const getUserIdentityWhere = (
  identifier: string,
  channel: AuthOtpChannel,
): Prisma.UserWhereInput => {
  // Match the unique email field for email authentication.
  if (channel === "EMAIL") {
    return { email: identifier };
  }

  // Match the existing unique mobile field for mobile authentication.
  return { mobile: identifier };
};

// Find any user by identity, including inactive records needed for uniqueness checks.
export const findUserByIdentifier = (
  identifier: string,
  channel: AuthOtpChannel,
) => {
  // Query one record because both supported identity fields are unique.
  return prisma.user.findFirst({
    where: getUserIdentityWhere(identifier, channel),
  });
};

// Find an account that is currently allowed to authenticate.
export const findActiveUserByIdentifier = (
  identifier: string,
  channel: AuthOtpChannel,
) => {
  // Exclude disabled and soft-deleted accounts from every login channel.
  return prisma.user.findFirst({
    where: {
      ...getUserIdentityWhere(identifier, channel),
      isActive: true,
      deletedAt: null,
    },
  });
};

// Create the existing mobile-first user record during successful signup.
export const createUser = (mobile: string, role: UserRole = "USER") => {
  // Let Prisma enforce mobile uniqueness at the database boundary.
  return prisma.user.create({ data: { mobile, role } });
};

// Find the newest OTP request for resend-cooldown enforcement.
export const findLatestOtp = (
  identifier: string,
  channel: AuthOtpChannel,
  purpose: AuthOtpPurpose,
) => {
  // Include verified and expired records because cooldown is based on request time.
  return prisma.authOtp.findFirst({
    where: { identifier, channel, purpose },
    orderBy: { createdAt: "desc" },
  });
};

// Count recent OTP requests from one IP to limit automated abuse.
export const countRecentOtpRequestsByIp = (
  ipAddress: string,
  createdAfter: Date,
) => {
  // Count database-backed requests so limits survive application restarts.
  return prisma.authOtp.count({
    where: { ipAddress, createdAt: { gte: createdAfter } },
  });
};

// Replace older unverified OTPs with one fresh single-use record.
export const replaceOtp = async (input: {
  userId?: string;
  identifier: string;
  channel: AuthOtpChannel;
  purpose: AuthOtpPurpose;
  otpHash: string;
  expiresAt: Date;
  retryAfter: number;
  ipAddress?: string;
  userAgent?: string;
}) => {
  // Remove active predecessors so only the newest code can be accepted.
  await prisma.authOtp.deleteMany({
    where: {
      identifier: input.identifier,
      channel: input.channel,
      purpose: input.purpose,
      verifiedAt: null,
    },
  });

  // Store only the secure OTP hash and request audit metadata.
  return prisma.authOtp.create({
    data: {
      userId: input.userId,
      identifier: input.identifier,
      channel: input.channel,
      purpose: input.purpose,
      otpHash: input.otpHash,
      expiresAt: input.expiresAt,
      retryAfter: input.retryAfter,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      attemptCount: 0,
    },
  });
};

// Delete an OTP that could not be delivered to prevent accepting an unseen code.
export const deleteOtp = (id: string) => {
  // Remove only the failed delivery record by its primary key.
  return prisma.authOtp.delete({ where: { id } });
};

// Find the newest unexpired and unverified OTP for one identity and purpose.
export const findActiveOtp = (
  identifier: string,
  channel: AuthOtpChannel,
  purpose: AuthOtpPurpose,
) => {
  // Require expiry to be in the future so the one-minute policy is enforced by DB time.
  return prisma.authOtp.findFirst({
    where: {
      identifier,
      channel,
      purpose,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
};

// Record one failed OTP attempt and lock the record at the configured threshold.
export const recordFailedOtpAttempt = (
  id: string,
  shouldLock: boolean,
  lockedUntil: Date,
) => {
  // Increment atomically so concurrent invalid attempts cannot overwrite each other.
  return prisma.authOtp.update({
    where: { id },
    data: {
      attemptCount: { increment: 1 },
      lockedUntil: shouldLock ? lockedUntil : undefined,
    },
  });
};

// Atomically claim a verified OTP so concurrent requests cannot reuse it.
export const claimOtp = (id: string) => {
  // Update only an unclaimed record and use the affected count as the race winner.
  return prisma.authOtp.updateMany({
    where: { id, verifiedAt: null },
    data: { verifiedAt: new Date() },
  });
};

// Persist successful login metadata and its session in one transaction.
export const completeLoginAndCreateSession = async (input: {
  userId: string;
  channel: AuthOtpChannel;
  tokenId: string;
  refreshTokenId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}) => {
  // Reuse one timestamp for verification and last-login audit fields.
  const authenticatedAt = new Date();

  // Mark only the identity channel that the user successfully proved.
  const verificationData: Prisma.UserUpdateInput =
    input.channel === "EMAIL"
      ? { emailVerifiedAt: authenticatedAt }
      : { mobileVerifiedAt: authenticatedAt };

  // Commit account metadata and session creation together to avoid partial login state.
  return prisma.$transaction([
    prisma.user.update({
      where: { id: input.userId },
      data: { ...verificationData, lastLoginAt: authenticatedAt },
    }),
    prisma.authSession.create({
      data: {
        userId: input.userId,
        tokenId: input.tokenId,
        refreshTokenId: input.refreshTokenId,
        expiresAt: input.expiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    }),
  ]);
};

// Create a replacement session during refresh-token rotation.
export const createSession = (input: {
  userId: string;
  tokenId: string;
  refreshTokenId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}) => {
  // Persist only token hashes so raw JWT values never reach the database.
  return prisma.authSession.create({ data: input });
};

// Find an active session using a hashed refresh token.
export const findSessionByRefreshToken = (refreshTokenId: string) => {
  // Include the user so refresh can reject inactive or deleted accounts.
  return prisma.authSession.findUnique({
    where: {
      refreshTokenId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
};

// Find an active session using a hashed access token.
export const findSessionByAccessToken = (tokenId: string) => {
  // Check session revocation on every protected request so logout takes effect immediately.
  return prisma.authSession.findUnique({
    where: {
      tokenId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
};

// Atomically claim one refresh session before issuing replacement tokens.
export const claimSessionForRotation = (sessionId: string) => {
  // Update only a still-active session so concurrent refresh requests cannot both win.
  return prisma.authSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: "token_rotation" },
  });
};

// Revoke one session with an accurate audit reason.
export const revokeSession = (sessionId: string, revokeReason: string) => {
  // Keep the session record for auditing while preventing further use.
  return prisma.authSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date(), revokeReason },
  });
};

// Fetch the safe profile fields returned by the authenticated /me endpoint.
export const findUserById = (id: string) => {
  // Exclude authentication, payment, and other sensitive relations from the response.
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      mobile: true,
      name: true,
      email: true,
      role: true,
      gender: true,
      avatarUrl: true,
      dateOfBirth: true,
      isActive: true,
      mobileVerifiedAt: true,
      emailVerifiedAt: true,
      onboardingStep: true,
      createdAt: true,
    },
  });
};
