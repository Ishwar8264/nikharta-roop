/**
 * Authentication business logic for mobile/email OTPs and JWT sessions.
 * Routes only validate transport concerns while this service owns auth rules.
 */

import { AuthOtpChannel, AuthOtpPurpose } from "@prisma/client";

import {
  AUTH_SESSION_EXPIRY_MS,
  OTP_EXPIRY_SECONDS,
  OTP_IP_RATE_LIMIT_MAX_REQUESTS,
  OTP_IP_RATE_LIMIT_WINDOW_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/src/constants/auth";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
  TooManyRequestsError,
  UnauthorizedError,
} from "@/src/lib/errors";
import {
  generateTokens,
  hashToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/src/lib/jwt";
import { generateOtp, hashOtp, verifyOtpHash } from "@/src/lib/otp";
import * as authQuery from "@/src/queries/auth/auth.query";
import { sendEmailOtp } from "@/src/services/email/email.service";
import type {
  AuthIdentifierInput,
  AuthRequestContext,
} from "@/src/types/auth";

// Use one generic success message to avoid revealing whether a login account exists.
const OTP_SENT_RESPONSE = { message: "OTP sent successfully" } as const;

// Convert validated route input into one normalized service identity.
const resolveAuthIdentifier = (
  input: AuthIdentifierInput,
): { identifier: string; channel: AuthOtpChannel } => {
  // Prefer email only after route validation guarantees a single identifier.
  if (input.email) {
    return { identifier: input.email.toLowerCase(), channel: "EMAIL" };
  }

  // Return the existing mobile identity when it is present.
  if (input.mobile) {
    return { identifier: input.mobile, channel: "MOBILE" };
  }

  // Protect internal callers that bypass the public Zod schemas.
  throw new BadRequestError("Provide exactly one of mobile or email");
};

// Deliver an OTP through the selected channel without mixing provider code into routes.
const deliverOtp = async (
  identifier: string,
  channel: AuthOtpChannel,
  otp: string,
  otpRecordId: string,
) => {
  // Delegate email delivery to the configured transactional provider.
  if (channel === "EMAIL") {
    await sendEmailOtp(identifier, otp, otpRecordId);

    // Stop after the selected email channel completes successfully.
    return;
  }

  // Keep the existing development mobile flow available until an SMS provider is configured.
  if (process.env.NODE_ENV !== "production") {
    console.info(`[DEV] Mobile OTP for ${identifier}: ${otp}`);

    // Stop after the deliberate development-only delivery fallback.
    return;
  }

  // Never claim successful mobile delivery in production without a real provider.
  throw new ServiceUnavailableError("Mobile OTP delivery is not configured");
};

// Enforce one resend cooldown per identity and purpose.
const enforceIdentifierCooldown = async (
  identifier: string,
  channel: AuthOtpChannel,
  purpose: AuthOtpPurpose,
) => {
  // Load the latest request regardless of its verification state.
  const latestOtp = await authQuery.findLatestOtp(identifier, channel, purpose);

  // Allow the first OTP request without applying a cooldown.
  if (!latestOtp) {
    return;
  }

  // Calculate when the identity may request another OTP.
  const nextAllowedAt =
    latestOtp.createdAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000;

  // Reject requests still inside the one-minute resend window.
  if (nextAllowedAt > Date.now()) {
    throw new TooManyRequestsError(
      "Please wait 1 minute before requesting another OTP",
    );
  }
};

// Enforce a database-backed request limit for the originating IP address.
const enforceIpRateLimit = async (ipAddress?: string) => {
  // Skip only when deployment infrastructure provides no reliable client IP.
  if (!ipAddress) {
    return;
  }

  // Calculate the start of the configured rolling rate-limit window.
  const windowStart = new Date(
    Date.now() - OTP_IP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  );

  // Count recent persisted OTP requests from the same source address.
  const requestCount = await authQuery.countRecentOtpRequestsByIp(
    ipAddress,
    windowStart,
  );

  // Reject excessive traffic without exposing internal bucket details.
  if (requestCount >= OTP_IP_RATE_LIMIT_MAX_REQUESTS) {
    throw new TooManyRequestsError();
  }
};

// Send an OTP for mobile signup or mobile/email login.
export const sendOtpService = async (
  input: AuthIdentifierInput,
  purpose: AuthOtpPurpose,
  context: AuthRequestContext = {},
) => {
  // Resolve one canonical identity and delivery channel.
  const { identifier, channel } = resolveAuthIdentifier(input);

  // Keep signup mobile-only until the required User.mobile field is redesigned.
  if (purpose === "SIGNUP" && channel === "EMAIL") {
    throw new BadRequestError("Email signup is not supported yet");
  }

  // Find any record first so signup uniqueness includes disabled and deleted users.
  const existingUser = await authQuery.findUserByIdentifier(identifier, channel);

  // Prevent a duplicate mobile account during explicit registration.
  if (purpose === "SIGNUP" && existingUser) {
    throw new ConflictError("User already registered. Please login.");
  }

  // Resolve only active, non-deleted accounts for login OTP delivery.
  const loginUser =
    purpose === "LOGIN"
      ? await authQuery.findActiveUserByIdentifier(identifier, channel)
      : null;

  // Return the same response for unknown or blocked login identities.
  if (purpose === "LOGIN" && !loginUser) {
    // Perform secure OTP work to reduce trivial response-timing differences.
    hashOtp(generateOtp());

    // Avoid revealing account status through the endpoint response.
    return OTP_SENT_RESPONSE;
  }

  // Stop rapid resends before generating or delivering another code.
  await enforceIdentifierCooldown(identifier, channel, purpose);

  // Stop excessive requests coming from the same source address.
  await enforceIpRateLimit(context.ipAddress);

  // Generate a cryptographically secure six-digit code.
  const otp = generateOtp();

  // Store only the server-keyed OTP hash in the database.
  const otpHash = hashOtp(otp);

  // Set expiry to exactly one minute after generation.
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

  // Persist the OTP before delivery so verification never races an absent record.
  const otpRecord = await authQuery.replaceOtp({
    userId: loginUser?.id,
    identifier,
    channel,
    purpose,
    otpHash,
    expiresAt,
    retryAfter: OTP_RESEND_COOLDOWN_SECONDS,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  try {
    // Deliver through the selected mobile or email provider.
    await deliverOtp(identifier, channel, otp, otpRecord.id);
  } catch (error) {
    // Remove an undelivered OTP so it can never be verified accidentally.
    await authQuery.deleteOtp(otpRecord.id);

    // Preserve the provider-safe application error for the route handler.
    throw error;
  }

  // Return the established response contract to existing mobile clients.
  return OTP_SENT_RESPONSE;
};

// Verify one OTP and create an authenticated JWT session.
export const verifyOtpService = async (
  input: AuthIdentifierInput,
  otp: string,
  purpose: AuthOtpPurpose,
  context: AuthRequestContext = {},
) => {
  // Resolve the same canonical identity used while sending the OTP.
  const { identifier, channel } = resolveAuthIdentifier(input);

  // Keep verification aligned with the current mobile-only signup rule.
  if (purpose === "SIGNUP" && channel === "EMAIL") {
    throw new BadRequestError("Email signup is not supported yet");
  }

  // Fetch only an unexpired and unclaimed OTP record.
  const otpRecord = await authQuery.findActiveOtp(identifier, channel, purpose);

  // Return one generic failure for missing, expired, or already-used codes.
  if (!otpRecord) {
    throw new BadRequestError("Invalid or expired OTP");
  }

  // Reject a record that has already reached the attempt threshold.
  if (otpRecord.attemptCount >= OTP_MAX_ATTEMPTS) {
    throw new BadRequestError("Max attempts exceeded. Request a new OTP.");
  }

  // Reject a record while its failed-attempt lock remains active.
  if (otpRecord.lockedUntil && otpRecord.lockedUntil > new Date()) {
    throw new BadRequestError("Max attempts exceeded. Request a new OTP.");
  }

  // Compare the entered OTP using the server-keyed constant-time helper.
  const isOtpValid = verifyOtpHash(otp, otpRecord.otpHash);

  // Record every invalid verification attempt before rejecting it.
  if (!isOtpValid) {
    // Determine whether this failure reaches the configured threshold.
    const shouldLock = otpRecord.attemptCount + 1 >= OTP_MAX_ATTEMPTS;

    // Increment atomically and lock only the final allowed attempt.
    await authQuery.recordFailedOtpAttempt(
      otpRecord.id,
      shouldLock,
      otpRecord.expiresAt,
    );

    // Use one unauthorized response for every incorrect OTP value.
    throw new UnauthorizedError("Invalid OTP");
  }

  // Atomically mark the OTP used so concurrent verification cannot reuse it.
  const claimedOtp = await authQuery.claimOtp(otpRecord.id);

  // Reject the losing concurrent request when another request claimed the code first.
  if (claimedOtp.count !== 1) {
    throw new BadRequestError("Invalid or expired OTP");
  }

  // Find the active login user after proof of identity succeeds.
  let user = await authQuery.findActiveUserByIdentifier(identifier, channel);

  // Create a mobile-first account only after a valid signup OTP is claimed.
  if (!user && purpose === "SIGNUP" && channel === "MOBILE") {
    user = await authQuery.createUser(identifier);
  }

  // Stop if the account was removed or disabled after OTP delivery.
  if (!user) {
    throw new UnauthorizedError("Authentication failed");
  }

  // Ensure the OTP still belongs to the same existing login account.
  if (purpose === "LOGIN" && otpRecord.userId !== user.id) {
    throw new UnauthorizedError("Authentication failed");
  }

  // Generate the short access token and rotating refresh token.
  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  // Hash the access token before database persistence.
  const hashedAccessToken = hashToken(accessToken);

  // Hash the refresh token before database persistence.
  const hashedRefreshToken = hashToken(refreshToken);

  // Align the database session lifetime with the refresh token lifetime.
  const sessionExpiresAt = new Date(Date.now() + AUTH_SESSION_EXPIRY_MS);

  // Persist verification metadata and the new session atomically.
  await authQuery.completeLoginAndCreateSession({
    userId: user.id,
    channel,
    tokenId: hashedAccessToken,
    refreshTokenId: hashedRefreshToken,
    expiresAt: sessionExpiresAt,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  // Return both identity fields so clients can render either login channel.
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
    },
  };
};

// Verify an access JWT and its persisted session for protected endpoints.
export const validateAccessSessionService = async (accessToken: string) => {
  // Verify JWT signature and expiry before reading its claims.
  const decoded = verifyAccessToken(accessToken);

  // Hash the presented token to locate its active database session.
  const hashedToken = hashToken(accessToken);

  // Load a non-revoked and unexpired session with its account.
  const session = await authQuery.findSessionByAccessToken(hashedToken);

  // Reject missing sessions, mismatched subjects, or blocked accounts.
  if (
    !session ||
    session.userId !== decoded.userId ||
    !session.user.isActive ||
    session.user.deletedAt
  ) {
    throw new UnauthorizedError("Session expired or revoked");
  }

  // Return trusted authorization claims only after both checks pass.
  return decoded;
};

// Rotate a valid refresh token and revoke its previous session.
export const refreshTokenService = async (
  refreshToken: string,
  context: AuthRequestContext = {},
) => {
  // Verify signature and expiry before trusting the token subject.
  const decoded = verifyRefreshToken(refreshToken);

  // Hash the raw refresh token to find its persisted session.
  const hashedRefreshToken = hashToken(refreshToken);

  // Load only a non-revoked and unexpired refresh session.
  const session = await authQuery.findSessionByRefreshToken(hashedRefreshToken);

  // Reject mismatched, inactive, deleted, expired, or revoked sessions.
  if (
    !session ||
    session.userId !== decoded.userId ||
    !session.user.isActive ||
    session.user.deletedAt
  ) {
    throw new UnauthorizedError("Session expired or revoked");
  }

  // Atomically claim and revoke the old session before issuing replacements.
  const claimedSession = await authQuery.claimSessionForRotation(session.id);

  // Reject refresh-token replay when another request already rotated this session.
  if (claimedSession.count !== 1) {
    throw new UnauthorizedError("Session expired or revoked");
  }

  // Generate a completely new access and refresh token pair.
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(
    session.userId,
    session.user.role,
  );

  // Hash the replacement access token for revocation checks.
  const newHashedAccessToken = hashToken(accessToken);

  // Hash the replacement refresh token for future rotation.
  const newHashedRefreshToken = hashToken(newRefreshToken);

  // Align the replacement database session with refresh-token expiry.
  const sessionExpiresAt = new Date(Date.now() + AUTH_SESSION_EXPIRY_MS);

  // Persist the replacement session with current request metadata.
  await authQuery.createSession({
    userId: session.userId,
    tokenId: newHashedAccessToken,
    refreshTokenId: newHashedRefreshToken,
    expiresAt: sessionExpiresAt,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  // Return the rotated pair using the existing API field names.
  return { accessToken, refreshToken: newRefreshToken };
};

// Revoke the session matching the presented access token.
export const logoutService = async (accessToken: string) => {
  // Hash the already-extracted raw token to find its active session.
  const hashedToken = hashToken(accessToken);

  // Find the current active session before attempting revocation.
  const session = await authQuery.findSessionByAccessToken(hashedToken);

  // Revoke the matching session when it still exists.
  if (session) {
    await authQuery.revokeSession(session.id, "user_logout");
  }

  // Keep logout idempotent for clients retrying the same request.
  return { message: "Logged out successfully" };
};

// Fetch the safe profile for the currently authenticated user.
export const getMeService = async (userId: string) => {
  // Load only fields explicitly selected by the query layer.
  const user = await authQuery.findUserById(userId);

  // Handle an account removed between middleware validation and this query.
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Return the safe user projection unchanged.
  return user;
};
