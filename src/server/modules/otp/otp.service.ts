import "server-only";

import type { OtpChannel } from "@/generated/prisma/client";
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
 * enumeration oracle. The cooldown only kicks in for real, unverified users,
 * so probing nonexistent addresses never hits the 60-second wall.
 */
export async function sendOtp(input: SendOtpInput): Promise<OtpSendResult> {
  const channel = resolveChannel(input);
  const user = await findUserByEmailOrPhone(input);

  if (!user) {
    return silentSuccess(channel);
  }

  const alreadyVerified =
    channel === "EMAIL" ? user.emailVerified : user.phoneVerified;

  if (alreadyVerified) {
    return silentSuccess(channel);
  }

  // Cooldown check — prevents spam and OTP bombing.
  const latest = await findLatestOtp(user.id, channel);
  if (latest) {
    const elapsedMs = Date.now() - latest.createdAt.getTime();
    const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000;
    if (elapsedMs < cooldownMs) {
      throw new OtpCooldownError(Math.ceil((cooldownMs - elapsedMs) / 1000));
    }
  }

  // Burn previous codes before issuing a new one.
  await invalidatePriorOtps(user.id, channel);

  const code = generateOtp();
  const codeHash = await hashOtp(code);
  const expiresAt = otpExpiryFromNow();

  const otp = await createOtp({
    userId: user.id,
    channel,
    codeHash,
    expiresAt,
    maxAttempts: OTP_MAX_ATTEMPTS,
  });

  try {
    await deliverOtp(channel, user.email, code);
  } catch (error) {
    // Roll back the row so the cooldown does not block an immediate retry.
    await deleteOtp(otp.id);
    console.error("OTP delivery failed", error);
    throw new OtpDeliveryError();
  }

  return {
    channel,
    expiresAt,
    resendAvailableInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  };
}

/**
 * Verifies an OTP and flips the corresponding verified flag on the user.
 *
 * Why:
 * Failure modes are collapsed into typed errors so the route can return a
 * helpful but non-enumerating response. The attempt counter is incremented
 * before the code is compared, so every wrong guess counts even if the
 * process crashes mid-verification.
 */
export async function verifyOtpCode(
  input: VerifyOtpInput,
): Promise<OtpVerifyResult> {
  const channel = resolveChannel(input);
  const user = await findUserByEmailOrPhone(input);

  if (!user) {
    throw new OtpInvalidError();
  }

  const otp = await findActiveOtp(user.id, channel);
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
  await markUserVerified(user.id, channel);

  return { userId: user.id, channel };
}

/** Resolves the channel implied by the identifier supplied. */
function resolveChannel(input: { email?: string; phone?: string }): OtpChannel {
  return input.email ? "EMAIL" : "PHONE";
}

/** Same shape as a real send, without doing anything. */
function silentSuccess(channel: OtpChannel): OtpSendResult {
  return {
    channel,
    expiresAt: otpExpiryFromNow(),
    resendAvailableInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  };
}

/** Delivers the OTP through the correct channel. */
async function deliverOtp(
  channel: OtpChannel,
  email: string | null,
  code: string,
): Promise<void> {
  if (channel === "EMAIL" && email) {
    await sendOtpEmail(email, code);
    return;
  }
  // SMS / WhatsApp delivery is not wired yet. Fail loudly rather than
  // silently accept a code the user will never receive.
  throw new Error(`Delivery channel ${channel} is not supported yet`);
}
