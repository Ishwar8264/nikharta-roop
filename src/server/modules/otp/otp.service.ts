import "server-only";

import type { OtpChannel, OtpPurpose } from "@/generated/prisma/client";
import { sendOtpEmail } from "@/lib/email";
import {
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  verifyOtp as compareOtp,
  generateOtp,
  hashOtp,
  otpExpiryFromNow,
} from "@/server/auth/otp";

import {
  OtpCooldownError,
  OtpDeliveryError,
  OtpExpiredError,
  OtpInvalidError,
  OtpMaxAttemptsError,
} from "./otp.errors";
import {
  createOtp,
  deleteOtp,
  findActiveOtp,
  findLatestOtp,
  findUserByEmailOrPhone,
  incrementOtpAttempts,
  invalidatePriorOtps,
  markOtpUsed,
  markUserVerified,
} from "./otp.repository";
import type {
  OtpSendResult,
  OtpVerifyResult,
  SendOtpInput,
  VerifyOtpInput,
} from "./otp.types";

/**
 * Issues a verification code to the identifier supplied.
 *
 * Why:
 * For unregistered or already-verified identifiers we return the same success
 * shape as for a real send. This prevents using the endpoint as an account
 * enumeration oracle.
 */
export async function sendOtp(input: SendOtpInput): Promise<OtpSendResult> {
  const channel = resolveChannel(input);
  const purpose: OtpPurpose =
    channel === "EMAIL" ? "EMAIL_VERIFICATION" : "PHONE_VERIFICATION";

  const user = await findUserByEmailOrPhone(input);

  if (!user) {
    return silentSuccess(channel);
  }

  const alreadyVerified =
    channel === "EMAIL" ? user.emailVerified : user.phoneVerified;

  if (alreadyVerified) {
    return silentSuccess(channel);
  }

  return issueOtp({
    userId: user.id,
    channel,
    purpose,
    email: user.email,
  });
}

/**
 * Verifies an OTP and flips the corresponding verified flag on the user.
 */
export async function verifyOtpCode(
  input: VerifyOtpInput,
): Promise<OtpVerifyResult> {
  const channel = resolveChannel(input);
  const purpose: OtpPurpose =
    channel === "EMAIL" ? "EMAIL_VERIFICATION" : "PHONE_VERIFICATION";

  const user = await findUserByEmailOrPhone(input);

  if (!user) {
    throw new OtpInvalidError();
  }

  await consumeOtp({
    userId: user.id,
    channel,
    purpose,
    code: input.code,
  });

  await markUserVerified(user.id, channel);

  return { userId: user.id, channel };
}

/**
 * Issues a new OTP row and delivers it, applying cooldown + rollback rules.
 *
 * Why:
 * Shared between email/phone verification and password reset so both flows
 * get identical cooldown, rollback, and error semantics.
 */
export async function issueOtp(input: {
  userId: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  email: string | null;
}): Promise<OtpSendResult> {
  const latest = await findLatestOtp(
    input.userId,
    input.channel,
    input.purpose,
  );

  if (latest) {
    const elapsedMs = Date.now() - latest.createdAt.getTime();
    const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000;
    if (elapsedMs < cooldownMs) {
      throw new OtpCooldownError(Math.ceil((cooldownMs - elapsedMs) / 1000));
    }
  }

  await invalidatePriorOtps(input.userId, input.channel, input.purpose);

  const code = generateOtp();
  const codeHash = await hashOtp(code);
  const expiresAt = otpExpiryFromNow();

  const otp = await createOtp({
    userId: input.userId,
    channel: input.channel,
    purpose: input.purpose,
    codeHash,
    expiresAt,
    maxAttempts: OTP_MAX_ATTEMPTS,
  });

  try {
    await deliverOtp(input.purpose, input.channel, input.email, code);
  } catch (error) {
    await deleteOtp(otp.id);
    console.error("OTP delivery failed", error);
    throw new OtpDeliveryError();
  }

  return {
    channel: input.channel,
    expiresAt,
    resendAvailableInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  };
}

/**
 * Verifies and burns a single OTP. Returns nothing — callers decide what
 * side effect to apply on success.
 *
 * Why:
 * Password reset needs the same verification steps (attempts, expiry, hash
 * compare, burn) but a different post-verify action. Splitting this out lets
 * both callers share one hardened path.
 */
export async function consumeOtp(input: {
  userId: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  code: string;
}): Promise<void> {
  const otp = await findActiveOtp(input.userId, input.channel, input.purpose);

  if (!otp) {
    throw new OtpInvalidError();
  }

  if (otp.attempts >= otp.maxAttempts) {
    await markOtpUsed(otp.id);
    throw new OtpMaxAttemptsError();
  }

  if (otp.expiresAt.getTime() < Date.now()) {
    await markOtpUsed(otp.id);
    throw new OtpExpiredError();
  }

  const matches = await compareOtp(input.code, otp.codeHash);
  if (!matches) {
    await incrementOtpAttempts(otp.id);
    throw new OtpInvalidError();
  }

  await markOtpUsed(otp.id);
}

function resolveChannel(input: { email?: string; phone?: string }): OtpChannel {
  return input.email ? "EMAIL" : "PHONE";
}

function silentSuccess(channel: OtpChannel): OtpSendResult {
  return {
    channel,
    expiresAt: otpExpiryFromNow(),
    resendAvailableInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  };
}

/** Delivers the OTP through the correct channel + template. */
async function deliverOtp(
  purpose: OtpPurpose,
  channel: OtpChannel,
  email: string | null,
  code: string,
): Promise<void> {
  if (channel === "EMAIL" && email && purpose === "PASSWORD_RESET") {
    const { sendPasswordResetEmail } = await import("@/lib/email");
    await sendPasswordResetEmail(email, code);
    return;
  }

  if (channel === "EMAIL" && email) {
    await sendOtpEmail(email, code);
    return;
  }

  throw new Error(`Delivery channel ${channel} is not supported yet`);
}
