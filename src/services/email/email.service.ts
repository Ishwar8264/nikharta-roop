import { ServiceUnavailableError } from "@/src/lib/errors";

// Define the stable Resend endpoint documented for transactional email delivery.
const RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails";

// Send a short-lived login OTP through the configured transactional email provider.
export const sendEmailOtp = async (
  email: string,
  otp: string,
  idempotencyKey: string,
) => {
  // Read provider configuration only when an email OTP is requested.
  const apiKey = process.env.RESEND_API_KEY;

  // Read the verified sender address configured for this application.
  const fromAddress = process.env.AUTH_EMAIL_FROM;

  // Allow local endpoint testing without accidentally calling a real provider.
  if (process.env.NODE_ENV !== "production" && (!apiKey || !fromAddress)) {
    // Print development OTPs only outside production until local email credentials exist.
    console.info(`[DEV] Email OTP for ${email}: ${otp}`);

    // Finish after the deliberate development-only delivery fallback.
    return;
  }

  // Fail closed in production instead of claiming an email was sent.
  if (!apiKey || !fromAddress) {
    throw new ServiceUnavailableError("Email OTP delivery is not configured");
  }

  // Send the transactional email through Resend's official HTTPS API.
  const response = await fetch(RESEND_EMAIL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "User-Agent": "nikharta-roop-auth/1.0",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [email],
      subject: "Your Nikharta Roop login code",
      text: `Your login code is ${otp}. It expires in 1 minute. Do not share this code.`,
    }),
  });

  // Hide provider details while reporting a temporary delivery failure safely.
  if (!response.ok) {
    throw new ServiceUnavailableError("Email OTP could not be delivered");
  }
};
