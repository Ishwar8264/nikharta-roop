import "server-only";

import type { OtpChannel, OtpPurpose } from "@/generated/prisma/client";
import { isCommonPassword } from "@/server/auth/breached-password";
import { hashPassword } from "@/server/auth/password";
import { WeakPasswordError } from "@/server/modules/auth/auth.errors";
import { sendOtpEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  verifyOtp as compareOtp,
  generateOtp,
  hashOtp,
  otpExpiryFromNow,
} from "@/server/auth/otp";

import {
  OtpAccountSetupRequiredError,
  OtpCooldownError,
  OtpDeliveryError,
  OtpExpiredError,
  OtpInvalidError,
  OtpMaxAttemptsError,
} from "./otp.errors";
import {
  createOtp,
  claimOtp,
  deleteOtp,
  findLatestOtp,
  findOtpForVerification,
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
    setup: user.password === null,
    staffActivation: input.staffActivation,
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

  const candidate = await verifyOtpCandidate({
    userId: user.id,
    channel,
    purpose,
    code: input.code,
  });

  // Only an email OTP may initialize a password; existing credentials are never overwritten.
  const needsPassword = channel === "EMAIL" && user.password === null;
  if (needsPassword && !input.newPassword) throw new OtpAccountSetupRequiredError();
  if (needsPassword && isCommonPassword(input.newPassword!)) {
    throw new WeakPasswordError();
  }
  const passwordHash = needsPassword ? await hashPassword(input.newPassword!) : undefined;

  await prisma.$transaction(async (transaction) => {
    const claimed = await claimOtp(
      candidate.id,
      candidate.attempts,
      transaction,
    );
    if (!claimed) throw new OtpInvalidError();

    if (passwordHash) {
      const updated = await transaction.user.updateMany({
        where: { id: user.id, accounts: { none: { provider: "credentials" } }, deletedAt: null },
        data: { emailVerified: true },
      });
      if (updated.count !== 1) throw new OtpInvalidError();
      const created = await transaction.account.createMany({
        data: [{ userId: user.id, provider: "credentials", providerUserId: user.id, passwordHash }],
        skipDuplicates: true,
      });
      if (created.count !== 1) throw new OtpInvalidError();
    } else {
      await markUserVerified(user.id, channel, transaction);
    }
  });

  return { userId: user.id, channel };
}

/**
 * Issues a new OTP row and delivers it, applying cooldown + rollback rules.
 *
 * Why:
 * Shared between email verification and password reset so both flows
 * get identical cooldown, rollback, and error semantics.
 */
export async function issueOtp(input: {
  userId: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  email: string | null;
  setup?: boolean;
  staffActivation?: boolean;
}): Promise<OtpSendResult> {
  const code = generateOtp();
  const codeHash = await hashOtp(code);
  const expiresAt = otpExpiryFromNow();
  const otp = await createOtpWithCooldown(input, codeHash, expiresAt);

  try {
    await deliverOtp(input.purpose, input.channel, input.email, code, input.setup, input.staffActivation);
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

/** Serializes resend checks so concurrent requests cannot create two live codes. */
async function createOtpWithCooldown(
  input: {
    userId: string;
    channel: OtpChannel;
    purpose: OtpPurpose;
  },
  codeHash: string,
  expiresAt: Date,
): Promise<{ id: string }> {
  const maxTransactionAttempts = 3;

  for (let attempt = 1; attempt <= maxTransactionAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (transaction) => {
          const latest = await findLatestOtp(
            input.userId,
            input.channel,
            input.purpose,
            transaction,
          );

          if (latest) {
            const elapsedMs = Date.now() - latest.createdAt.getTime();
            const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000;
            if (elapsedMs < cooldownMs) {
              throw new OtpCooldownError(
                Math.ceil((cooldownMs - elapsedMs) / 1000),
              );
            }
          }

          await invalidatePriorOtps(
            input.userId,
            input.channel,
            input.purpose,
            transaction,
          );

          return createOtp(
            {
              userId: input.userId,
              channel: input.channel,
              purpose: input.purpose,
              codeHash,
              expiresAt,
              maxAttempts: OTP_MAX_ATTEMPTS,
            },
            transaction,
          );
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (!isSerializationConflict(error) || attempt === maxTransactionAttempts) {
        throw error;
      }
    }
  }

  throw new Error("OTP transaction retry budget exhausted");
}

function isSerializationConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

export interface VerifiedOtpCandidate {
  id: string;
  attempts: number;
}

/** Verifies an OTP hash without consuming it, enabling atomic caller effects. */
export async function verifyOtpCandidate(input: {
  userId: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  code: string;
}): Promise<VerifiedOtpCandidate> {
  const otp = await findOtpForVerification(
    input.userId,
    input.channel,
    input.purpose,
  );

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
    const incremented = await incrementOtpAttempts(otp.id, otp.maxAttempts);
    if (!incremented || otp.attempts + 1 >= otp.maxAttempts) {
      await markOtpUsed(otp.id);
      throw new OtpMaxAttemptsError();
    }
    throw new OtpInvalidError();
  }

  return { id: otp.id, attempts: otp.attempts };
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
  setup = false,
  staffActivation = false,
): Promise<void> {
  if (channel === "EMAIL" && email && purpose === "PASSWORD_RESET") {
    const { sendPasswordResetEmail } = await import("@/lib/email");
    await sendPasswordResetEmail(email, code);
    return;
  }

  if (channel === "EMAIL" && email) {
    await sendOtpEmail(email, code, setup, staffActivation);
    return;
  }

  throw new Error(`Delivery channel ${channel} is not supported yet`);
}
