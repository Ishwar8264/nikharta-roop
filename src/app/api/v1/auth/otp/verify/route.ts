import { NextResponse } from "next/server";

import {
  OtpExpiredError,
  OtpInvalidError,
  OtpMaxAttemptsError,
} from "@/server/modules/otp/otp.errors";
import { verifyOtpSchema } from "@/server/modules/otp/otp.schema";
import { verifyOtpCode } from "@/server/modules/otp/otp.service";

/**
 * Verifies an OTP and marks the corresponding identifier as verified.
 *
 * Why:
 * Public route — an unverified user cannot log in, so they have no token to
 * authenticate with here. Error messages stay informative but never reveal
 * whether the identifier exists.
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

  const validation = verifyOtpSchema.safeParse(body);

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
    const result = await verifyOtpCode(validation.data);

    return NextResponse.json(
      {
        message: "Verification successful",
        data: { userId: result.userId, channel: result.channel },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof OtpInvalidError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error instanceof OtpExpiredError) {
      return NextResponse.json({ message: error.message }, { status: 410 });
    }

    if (error instanceof OtpMaxAttemptsError) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }

    console.error("OTP verify failed", error);
    return NextResponse.json(
      { message: "Unable to verify code" },
      { status: 500 },
    );
  }
}
