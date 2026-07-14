/**
 * ========================================================
 * AUTH DATA ACCESS LAYER (REPOSITORY)
 * All direct Prisma database queries for authentication go here.
 * This keeps the business logic (service layer) clean and testable.
 * ========================================================
 */

import { prisma } from "@/src/lib/prisma";
import { AuthOtpPurpose, UserRole } from "@prisma/client";

/**
 * Fetch a user record by their unique mobile number.
 * Used during login and signup flows to check if the user exists.
 */
export const findUserByMobile = (mobile: string) => {
  return prisma.user.findUnique({ where: { mobile } });
};

/**
 * Create a new user in the database.
 * By default, assigns the 'USER' role if no specific role is provided.
 */
export const createUser = (mobile: string, role: UserRole = "USER") => {
  return prisma.user.create({ data: { mobile, role } });
};

/**
 * Create or replace an OTP entry for a specific mobile number and purpose.
 * Steps:
 * 1. Deletes any previously generated, unverified OTPs for this mobile to avoid clutter.
 * 2. Creates a fresh OTP record with the hashed value, expiry, and attempt counter set to 0.
 */
export const upsertOtp = async (
  mobile: string,
  otpHash: string,
  purpose: AuthOtpPurpose,
  expiresAt: Date,
) => {
  // Delete previous unverified OTPs for this mobile and purpose to keep the table clean
  await prisma.authOtp.deleteMany({
    where: { mobile, purpose, verifiedAt: null },
  });

  // Insert the new OTP record
  return prisma.authOtp.create({
    data: { mobile, otpHash, purpose, expiresAt, attemptCount: 0 },
  });
};

/**
 * Find the most recent, active, unverified OTP for a given mobile and purpose.
 * Active means: not yet verified, and the expiry time is in the future.
 */
export const findActiveOtp = (mobile: string, purpose: AuthOtpPurpose) => {
  return prisma.authOtp.findFirst({
    where: { mobile, purpose, verifiedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Increment the attempt counter for a specific OTP record.
 * Used to enforce brute-force protection (e.g., lock account after 5 failed attempts).
 */
export const updateOtpAttempt = (id: string) => {
  return prisma.authOtp.update({
    where: { id },
    data: { attemptCount: { increment: 1 } },
  });
};

/**
 * Mark an OTP record as successfully verified by setting the verification timestamp.
 * This prevents the same OTP from being reused.
 */
export const markOtpVerified = (id: string) => {
  return prisma.authOtp.update({
    where: { id },
    data: { verifiedAt: new Date() },
  });
};

/**
 * Create a new authentication session for a logged-in user.
 * Note: We store the SHA-256 hash of the raw JWT tokens (access and refresh)
 * in the database for security. The raw tokens are only sent to the client.
 */
export const createSession = (
  userId: string,
  tokenId: string,
  refreshTokenId: string,
  expiresAt: Date,
) => {
  return prisma.authSession.create({
    data: { userId, tokenId, refreshTokenId, expiresAt },
  });
};

/**
 * Find a valid session using the hashed refresh token.
 * A valid session means: not revoked, and not expired.
 * Also fetches the associated user data (needed for generating new tokens).
 */
export const findSessionByRefreshToken = (refreshTokenId: string) => {
  return prisma.authSession.findUnique({
    where: { refreshTokenId, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
};

/**
 * Revoke an active session.
 * Used when a user logs out, or during token rotation (old refresh token is invalidated).
 */
export const revokeSession = (sessionId: string) => {
  return prisma.authSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date(), revokeReason: "user_logout" },
  });
};

/**
 * Fetch a user record by their unique ID.
 * Used by the /me endpoint to get the logged-in user's profile.
 */
export const findUserById = (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    // Select only the fields we want to send to the frontend (exclude sensitive relations)
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
      onboardingStep: true,
      createdAt: true,
      // Do NOT include authOtps, authSessions, payments, etc. for security
    },
  });
};
