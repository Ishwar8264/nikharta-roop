import { createHash, randomInt } from "node:crypto";

import { getDb } from "@/db";
import { parseJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import { authError, authJson } from "@/features/auth/responses/auth.responses";
import { registerSchema, type RegisterInput } from "@/schema/auth/schema.auth";

/**
 * Handles the public register endpoint.
 *
 * Responsibilities:
 * - Parse and validate the incoming JSON request.
 * - Return validation errors in the shared auth response shape.
 * - Delegate signup OTP creation to `startSignupOtp`.
 */
export async function handleRegister(request: Request) {
  const parsedBody = await parseJsonBody(request, registerSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return startSignupOtp(parsedBody.data);
}

/**
 * Starts mobile-first registration by creating a signup OTP.
 *
 * This endpoint does not create a user. The verify endpoint will compare the
 * OTP, create the USER row, set `mobileVerifiedAt`, and start the session.
 */
async function startSignupOtp(input: RegisterInput) {
  const db = getDb();
  const email = input.email || null;
  const otp = generateOtp();

  try {
    const existingUser = await db.user.findUnique({
      where: {
        mobile: input.mobile,
      },
    });

    if (existingUser) {
      return authError({
        code: "ACCOUNT_ALREADY_EXISTS",
        message: "इस मोबाइल नंबर से account पहले से मौजूद है। कृपया login करें।",
        status: 409,
      });
    }

    const otpRecord = await db.authOtp.create({
      data: {
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        metadata: {
          email,
          name: input.name ?? null,
          source: "register_endpoint",
        },
        mobile: input.mobile,
        otpHash: hashOtp(input.mobile, otp),
        purpose: "SIGNUP",
        retryAfter: 30,
      },
      select: {
        createdAt: true,
        expiresAt: true,
        id: true,
        mobile: true,
        retryAfter: true,
      },
    });

    await db.authEvent.create({
      data: {
        metadata: {
          email,
          name: input.name ?? null,
          otpId: otpRecord.id,
          source: "register_endpoint",
        },
        mobile: input.mobile,
        type: "SIGNUP_STARTED",
      },
    });

    return authJson({
      code: "AUTH_SIGNUP_OTP_SENT",
      data: {
        devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
        expiresAt: otpRecord.expiresAt,
        mobile: otpRecord.mobile,
        retryAfter: otpRecord.retryAfter,
      },
      message: "OTP भेज दिया गया है। OTP verify करने के बाद account बनेगा।",
      status: 200,
      success: true,
    });
  } catch {
    return authError({
      code: "AUTH_SIGNUP_OTP_FAILED",
      message: "OTP भेजा नहीं जा सका। थोड़ी देर बाद फिर प्रयास करें।",
      status: 500,
    });
  }
}

/**
 * Generates a 6-digit OTP string.
 */
function generateOtp() {
  return String(randomInt(100000, 1000000));
}

/**
 * Hashes the OTP with the mobile number and app secret.
 *
 * Plain OTP values are never stored in the database. The non-production
 * `devOtp` response exists only so local Swagger/manual testing is possible
 * before SMS integration is added.
 */
function hashOtp(mobile: string, otp: string) {
  const secret =
    process.env.AUTH_OTP_SECRET ??
    process.env.BETTER_AUTH_SECRET ??
    "dev-only-change-me";

  return createHash("sha256")
    .update(`${mobile}:${otp}:${secret}`)
    .digest("hex");
}
