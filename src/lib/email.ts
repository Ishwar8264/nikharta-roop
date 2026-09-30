import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { Resend } from "resend";

import {
  AUTH_EMAIL_LOGO_CONTENT_ID,
  createOtpEmail,
  createPasswordResetEmail,
} from "@/lib/email/auth-email.template";

const resendApiKey = process.env.RESEND_API_KEY;
const configuredEmailFrom = process.env.EMAIL_FROM;

const emailFrom = configuredEmailFrom ?? "onboarding@resend.dev";

const resend = resendApiKey ? new Resend(resendApiKey) : null;
let logoContentPromise: Promise<Buffer> | undefined;

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

  const message = createOtpEmail(code);
  const { error } = await resend.emails.send({
    from: emailFrom,
    to,
    ...message,
    attachments: [await getLogoAttachment()],
  });

  if (error) {
    throw new Error(`Resend rejected the message: ${error.message}`);
  }
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

  const message = createPasswordResetEmail(code);
  const { error } = await resend.emails.send({
    from: emailFrom,
    to,
    ...message,
    attachments: [await getLogoAttachment()],
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

/** Loads the brand mark once and embeds it so mail clients need no remote URL. */
async function getLogoAttachment() {
  logoContentPromise ??= readFile(
    path.join(
      process.cwd(),
      "public",
      "brand",
      "logo",
      "nikharta-roop-mark-light-512.png",
    ),
  );

  return {
    content: await logoContentPromise,
    filename: "nikharta-roop-logo.png",
    contentType: "image/png",
    contentId: AUTH_EMAIL_LOGO_CONTENT_ID,
  };
}
