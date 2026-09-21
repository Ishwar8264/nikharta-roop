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
import { findUserByEmailOrPhone } from "@/server/modules/otp/otp.repository";
import { consumeOtp, issueOtp } from "@/server/modules/otp/otp.service";

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
 * Runs the password update and session revocation in a single transaction:
 * if the reset succeeds but revocation fails, an attacker who stole a
 * refresh token would keep access. Atomicity is the whole point.
 */
export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const user = await findUserByEmailOrPhone({ email: input.email });

  if (!user) {
    // Surface as invalid code rather than "user not found" — same reason as
    // above, we do not confirm whether the email exists.
    throw new OtpInvalidError();
  }

  await consumeOtp({
    userId: user.id,
    channel: "EMAIL",
    purpose: "PASSWORD_RESET",
    code: input.code,
  });

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

// Re-export to avoid an extra import in the route.
export {
  OtpCooldownError,
  OtpExpiredError,
  OtpInvalidError,
  OtpMaxAttemptsError,
} from "@/server/modules/otp/otp.errors";
export { OtpDeliveryError };
