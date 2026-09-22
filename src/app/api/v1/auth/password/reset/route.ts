import { NextResponse } from "next/server";

import {
  OtpExpiredError,
  OtpInvalidError,
  OtpMaxAttemptsError,
} from "@/server/modules/otp/otp.errors";
import { resetPasswordSchema } from "@/server/modules/password/password.schema";
import { resetPassword } from "@/server/modules/password/password.service";

/**
 * Completes the reset by verifying the code and setting a new password.
 *
 * Why:
 * On success, every refresh token is revoked inside the password transaction.
 * Existing short-lived access tokens expire naturally within 15 minutes.
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

  const validation = resetPasswordSchema.safeParse(body);

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
    await resetPassword(validation.data);

    return NextResponse.json(
      {
        message: "Password updated. Please sign in again.",
        data: null,
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

    console.error("Password reset failed", error);
    return NextResponse.json(
      { message: "Unable to reset password" },
      { status: 500 },
    );
  }
}
