import "server-only";

import { prisma } from "@/lib/prisma";
import {
  OTP_RESEND_COOLDOWN_SECONDS,
  otpExpiryFromNow,
} from "@/server/auth/otp";
import { hashPassword } from "@/server/auth/password";
import {
  OtpDeliveryError,
  OtpInvalidError,
} from "@/server/modules/otp/otp.errors";
import {
  claimOtp,
  findUserByEmailOrPhone,
} from "@/server/modules/otp/otp.repository";
import {
  issueOtp,
  verifyOtpCandidate,
} from "@/server/modules/otp/otp.service";

import type {
  ForgotPasswordInput,
  ForgotPasswordResult,
  ResetPasswordInput,
} from "./password.types";

/**
 * Issues a password reset code if the email belongs to a real user.
 *
 * Why:
 * Returns an identical success shape when the email is unknown, so the
 * endpoint cannot be used to enumerate registered emails. Only sends a code
 * when there is a real recipient.
 */
export async function requestPasswordReset(
  input: ForgotPasswordInput,
): Promise<ForgotPasswordResult> {
  const user = await findUserByEmailOrPhone({ email: input.email });

  if (!user || !user.email) {
    // Same shape as success — the client cannot tell the account apart.
    return {
      expiresAt: otpExpiryFromNow(),
      resendAvailableInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    };
  }

  const result = await issueOtp({
    userId: user.id,
    channel: "EMAIL",
    purpose: "PASSWORD_RESET",
    email: user.email,
  });

  return {
    expiresAt: result.expiresAt,
    resendAvailableInSeconds: result.resendAvailableInSeconds,
  };
}

/**
 * Applies a new password after verifying the reset code.
 *
 * Why:
 * Runs password update, OTP claim, and refresh revocation in one transaction.
 * A partial reset must never burn the user's one-time code without changing
 * their password or leave a long-lived refresh session active.
 */
export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const user = await findUserByEmailOrPhone({ email: input.email });

  if (!user) {
    // Surface as invalid code rather than "user not found" — same reason as
    // above, we do not confirm whether the email exists.
    throw new OtpInvalidError();
  }

  const candidate = await verifyOtpCandidate({
    userId: user.id,
    channel: "EMAIL",
    purpose: "PASSWORD_RESET",
    code: input.code,
  });

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.$transaction(async (transaction) => {
    const claimed = await claimOtp(
      candidate.id,
      candidate.attempts,
      transaction,
    );
    if (!claimed) throw new OtpInvalidError();

    await transaction.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    });
    await transaction.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });
}

// Re-export to avoid an extra import in the route.
export {
  OtpCooldownError,
  OtpExpiredError,
  OtpInvalidError,
  OtpMaxAttemptsError,
} from "@/server/modules/otp/otp.errors";
export { OtpDeliveryError };
