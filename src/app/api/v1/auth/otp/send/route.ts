import { NextResponse } from "next/server";

import {
  OtpCooldownError,
  OtpDeliveryError,
} from "@/server/modules/otp/otp.errors";
import { sendOtpSchema } from "@/server/modules/otp/otp.schema";
import { sendOtp } from "@/server/modules/otp/otp.service";

/**
 * Issues a fresh email verification code.
 *
 * Why:
 * Runs before the user can log in, so it stays on the public surface. The
 * response shape is identical whether the identifier exists or not, which
 * prevents the endpoint from being used to enumerate accounts.
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

  const validation = sendOtpSchema.safeParse(body);

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
    const result = await sendOtp(validation.data);

    return NextResponse.json(
      {
        message: "Verification code sent",
        data: {
          channel: result.channel,
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

    console.error("OTP send failed", error);
    return NextResponse.json(
      { message: "Unable to send verification code" },
      { status: 500 },
    );
  }
}
