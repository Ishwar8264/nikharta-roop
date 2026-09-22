import { NextResponse } from "next/server";

import {
  OtpCooldownError,
  OtpDeliveryError,
} from "@/server/modules/otp/otp.errors";
import { forgotPasswordSchema } from "@/server/modules/password/password.schema";
import { requestPasswordReset } from "@/server/modules/password/password.service";

/**
 * Starts the password reset flow by emailing a 6-digit code.
 *
 * Why:
 * Public route — the caller has no session. The response is the same whether
 * the email is registered or not, so the endpoint cannot be used to
 * enumerate accounts.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const validation = forgotPasswordSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const result = await requestPasswordReset(validation.data);

    return NextResponse.json(
      {
        message: "If the email exists, a reset code has been sent",
        data: {
          expiresAt: result.expiresAt,
          resendAvailableInSeconds: result.resendAvailableInSeconds,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof OtpCooldownError) {
      return NextResponse.json(
        { message: error.message },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSeconds) },
        },
      );
    }

    if (error instanceof OtpDeliveryError) {
      return NextResponse.json({ message: error.message }, { status: 502 });
    }

    console.error("Password reset request failed", error);
    return NextResponse.json(
      { message: "Unable to start password reset" },
      { status: 500 },
    );
  }
}
