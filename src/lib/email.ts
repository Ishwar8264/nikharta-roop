import "server-only";

import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const configuredEmailFrom = process.env.EMAIL_FROM;

const emailFrom = configuredEmailFrom ?? "onboarding@resend.dev";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Sends a verification code to the given email address.
 *
 * Why:
 * When RESEND_API_KEY is absent in local development, the OTP is printed to the
 * server console instead of being sent. This keeps onboarding friction low
 * while production fails fast instead of leaking codes into server logs.
 */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  assertEmailConfiguration();

  if (!resend) {
    console.log(`\n📧 [DEV EMAIL] OTP for ${to}: ${code}\n`);
    return;
  }

  const { error } = await resend.emails.send({
    from: emailFrom,
    to,
    subject: "Your verification code",
    html: renderOtpHtml(code),
  });

  if (error) {
    throw new Error(`Resend rejected the message: ${error.message}`);
  }
}

/** Minimal, self-contained HTML so we do not depend on a template engine. */
function renderOtpHtml(code: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Verify your email</h2>
      <p>Use the code below to verify your account. It expires in 10 minutes.</p>
      <p style="font-size: 32px; letter-spacing: 6px; font-weight: bold;">${code}</p>
      <p style="color: #666; font-size: 12px;">
        If you did not request this code, you can safely ignore this email.
      </p>
    </div>
  `;
}

/** Sends a password reset code to the given email address. */
export async function sendPasswordResetEmail(
  to: string,
  code: string,
): Promise<void> {
  assertEmailConfiguration();

  if (!resend) {
    console.log(`\n🔐 [DEV EMAIL] Password reset for ${to}: ${code}\n`);
    return;
  }

  const { error } = await resend.emails.send({
    from: emailFrom,
    to,
    subject: "Reset your password",
    html: renderPasswordResetHtml(code),
  });

  if (error) {
    throw new Error(`Resend rejected the message: ${error.message}`);
  }
}

/** Prevents production from logging OTPs or using Resend's development sender. */
function assertEmailConfiguration(): void {
  if (
    process.env.NODE_ENV === "production" &&
    (!resendApiKey || !configuredEmailFrom)
  ) {
    throw new Error("RESEND_API_KEY and EMAIL_FROM are required in production");
  }
}

function renderPasswordResetHtml(code: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Reset your password</h2>
      <p>Use the code below to set a new password. It expires in 10 minutes.</p>
      <p style="font-size: 32px; letter-spacing: 6px; font-weight: bold;">${code}</p>
      <p style="color: #666; font-size: 12px;">
        If you did not request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;
}
