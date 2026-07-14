/**
 * ========================================================
 * AUTHENTICATION BUSINESS LOGIC (SERVICE LAYER)
 * Handles OTP generation, verification, token creation, and session management.
 * All Prisma calls are delegated to the query layer (authQuery) for clean separation.
 * ========================================================
 */

import jwt from "jsonwebtoken";

// Import custom error classes for standardized error handling
import {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
} from "@/src/lib/errors";

// Import token generation and hashing utilities
import { generateTokens, hashToken } from "@/src/lib/jwt";

// Import OTP generation and hashing utilities
import { generateOtp, hashOtp } from "@/src/lib/otp";

// Import Prisma client singleton
import { prisma } from "@/src/lib/prisma";

// Import all database query functions for auth as a namespace
import * as authQuery from "@/src/queries/auth/auth.query";

// ====================================================================
// CONSTANTS
// ====================================================================

const OTP_EXPIRY_MINUTES = 10; // OTP is valid for 10 minutes
const MAX_OTP_ATTEMPTS = 5; // Max failed attempts before locking

// ====================================================================
// PUBLIC SERVICE FUNCTIONS
// ====================================================================

/**
 * Send an OTP to the user's mobile number.
 * Logic:
 * 1. If purpose is SIGNUP, ensure user does NOT already exist.
 * 2. If purpose is LOGIN, ensure user DOES already exist.
 * 3. Generate a random 6-digit OTP and its SHA-256 hash.
 * 4. Store the hash in the database (never store plain text OTP).
 * 5. (Placeholder) Send OTP via SMS/WhatsApp.
 */
export const sendOtpService = async (
  mobile: string,
  purpose: "LOGIN" | "SIGNUP",
) => {
  // 1. Check user existence based on purpose
  const existingUser = await authQuery.findUserByMobile(mobile);
  if (purpose === "SIGNUP" && existingUser) {
    throw new ConflictError("User already registered. Please login.");
  }
  if (purpose === "LOGIN" && !existingUser) {
    throw new BadRequestError("User not found. Please signup.");
  }

  // 2. Generate OTP & Hash
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // 3. Save to DB (delete old unverified OTPs for this mobile)
  await authQuery.upsertOtp(mobile, otpHash, purpose, expiresAt);

  // 4. Send OTP (SMS/WhatsApp via your provider)
  // NOTE: Uncomment the actual SMS service when ready.
  // await NotificationService.sendSms(mobile, `Your OTP is ${otp}`);
  console.log(`[DEV] OTP for ${mobile}: ${otp}`); // Remove in production

  return { message: "OTP sent successfully" };
};

/**
 * Verify the OTP entered by the user and complete login/signup.
 * Logic:
 * 1. Fetch the active OTP record from DB.
 * 2. Check attempt limits and lock status.
 * 3. Compare the hashed input OTP with the stored hash.
 * 4. If valid, create user (if signup) or fetch existing user.
 * 5. Generate JWT tokens (Access & Refresh).
 * 6. Store hashed tokens in the AuthSession table.
 */
export const verifyOtpService = async (
  mobile: string,
  otp: string,
  purpose: "LOGIN" | "SIGNUP",
) => {
  // 1. Find active OTP record
  const otpRecord = await authQuery.findActiveOtp(mobile, purpose);
  if (!otpRecord) throw new BadRequestError("Invalid or expired OTP");

  // 2. Check attempts and lock status
  if (otpRecord.attemptCount >= MAX_OTP_ATTEMPTS) {
    throw new BadRequestError("Max attempts exceeded. Request a new OTP.");
  }
  if (otpRecord.lockedUntil && otpRecord.lockedUntil > new Date()) {
    throw new BadRequestError(
      "Account locked due to multiple failures. Try later.",
    );
  }

  // 3. Verify hash (compare input hash with stored hash)
  const hashedInput = hashOtp(otp);
  if (hashedInput !== otpRecord.otpHash) {
    await authQuery.updateOtpAttempt(otpRecord.id);
    throw new UnauthorizedError("Invalid OTP");
  }

  // 4. Mark OTP as verified (prevents reuse)
  await authQuery.markOtpVerified(otpRecord.id);

  // 5. Get existing user or create a new one (for SIGNUP)
  let user = await authQuery.findUserByMobile(mobile);
  if (!user) {
    user = await authQuery.createUser(mobile); // Signup flow
  }

  // 6. Generate Access & Refresh Tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  // 7. Create Session (store hashed tokens in DB for security)
  const hashedAccess = hashToken(accessToken);
  const hashedRefresh = hashToken(refreshToken);
  const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await authQuery.createSession(
    user.id,
    hashedAccess,
    hashedRefresh,
    sessionExpiry,
  );

  // 8. Return tokens and user data to the client
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, mobile: user.mobile, role: user.role },
  };
};

/**
 * Refresh the Access Token using a valid Refresh Token.
 * Logic (Security Best Practice - Token Rotation):
 * 1. Verify the refresh token JWT signature.
 * 2. Find the session in DB using the hashed refresh token.
 * 3. Revoke the old session immediately.
 * 4. Generate a completely new pair of tokens.
 * 5. Create a new session with the new hashed tokens.
 */
export const refreshTokenService = async (refreshToken: string) => {
  // 1. Verify JWT signature - just check if it's valid, we don't need the decoded payload
  try {
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
  } catch {
    throw new UnauthorizedError("Invalid refresh token");
  }

  // 2. Find session in DB using the hashed refresh token (rest of the code remains exactly the same)
  const hashedRefresh = hashToken(refreshToken);
  const session = await authQuery.findSessionByRefreshToken(hashedRefresh);
  if (!session) throw new UnauthorizedError("Session expired or revoked");

  // 3. Revoke old session (Token rotation for security)
  await authQuery.revokeSession(session.id);

  // 4. Generate new tokens
  const { accessToken: newAccess, refreshToken: newRefresh } = generateTokens(
    session.userId,
    session.user.role,
  );

  // 5. Create new session with new hashed tokens
  const newHashedAccess = hashToken(newAccess);
  const newHashedRefresh = hashToken(newRefresh);
  const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await authQuery.createSession(
    session.userId,
    newHashedAccess,
    newHashedRefresh,
    sessionExpiry,
  );

  return { accessToken: newAccess, refreshToken: newRefresh };
};

/**
 * Log the user out by revoking their active session.
 * Logic:
 * 1. Extract the raw access token from the Authorization header.
 * 2. Hash it to match the stored tokenId in the database.
 * 3. Find and revoke the matching session.
 */
export const logoutService = async (accessToken: string) => {
  // Extract token from "Bearer <token>" and hash it
  const token = accessToken.split(" ")[1];
  const hashedToken = hashToken(token);

  // Find session by hashed access token
  const session = await prisma.authSession.findFirst({
    where: { tokenId: hashedToken },
  });

  // If found, revoke it
  if (session) {
    await authQuery.revokeSession(session.id);
  }
  return { message: "Logged out successfully" };
};

/**
 * Get the currently authenticated user's profile information.
 * Uses the userId extracted from the JWT token by the withAuth middleware.
 */
export const getMeService = async (userId: string) => {
  // Fetch user from DB using the repository query
  const user = await authQuery.findUserById(userId);

  // If user somehow doesn't exist (e.g., deleted account but token still valid), throw error
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
};
