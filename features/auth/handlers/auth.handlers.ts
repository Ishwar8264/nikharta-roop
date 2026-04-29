import { createHash, randomInt } from "node:crypto";

import { getDb } from "@/db";
import {
  AUTH_CODES,
  AUTH_MESSAGES,
  AUTH_OTP_CONFIG,
  AUTH_SOURCES,
} from "@/features/auth/constants/auth.constants";
import { parseJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import { authError, authJson } from "@/features/auth/responses/auth.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { registerSchema, type RegisterInput } from "@/schema/auth/schema.auth";

type RequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

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

  return startSignupOtp(parsedBody.data, getRequestContext(request));
}

/**
 * Starts mobile-first registration by creating a signup OTP.
 *
 * This endpoint does not create a user. The verify endpoint will compare the
 * OTP, create the USER row, set `mobileVerifiedAt`, and start the session.
 */
async function startSignupOtp(
  input: RegisterInput,
  context: RequestContext,
) {
  const db = getDb();
  const email = input.email || null;
  const otp = generateOtp();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + AUTH_OTP_CONFIG.EXPIRES_IN_MINUTES * 60 * 1000,
  );

  try {
    const otpRecord = await db.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: {
          mobile: input.mobile,
        },
      });

      if (existingUser) {
        return {
          status: "account_exists" as const,
        };
      }

      const recentOtp = await tx.authOtp.findFirst({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          createdAt: true,
          expiresAt: true,
          mobile: true,
          retryAfter: true,
        },
        where: {
          createdAt: {
            gt: new Date(
              now.getTime() - AUTH_OTP_CONFIG.RETRY_AFTER_SECONDS * 1000,
            ),
          },
          mobile: input.mobile,
          purpose: AUTH_OTP_CONFIG.PURPOSE_SIGNUP,
          verifiedAt: null,
        },
      });

      if (recentOtp) {
        return {
          status: "retry_later" as const,
          recentOtp,
        };
      }

      await tx.authOtp.updateMany({
        data: {
          expiresAt: now,
        },
        where: {
          expiresAt: {
            gt: now,
          },
          mobile: input.mobile,
          purpose: AUTH_OTP_CONFIG.PURPOSE_SIGNUP,
          verifiedAt: null,
        },
      });

      const createdOtp = await tx.authOtp.create({
        data: {
          expiresAt,
          ipAddress: context.ipAddress,
          metadata: {
            email,
            name: input.name ?? null,
            source: AUTH_SOURCES.REGISTER_ENDPOINT,
          },
          mobile: input.mobile,
          otpHash: hashOtp(input.mobile, otp),
          purpose: AUTH_OTP_CONFIG.PURPOSE_SIGNUP,
          retryAfter: AUTH_OTP_CONFIG.RETRY_AFTER_SECONDS,
          userAgent: context.userAgent,
        },
        select: {
          expiresAt: true,
          id: true,
          mobile: true,
          retryAfter: true,
        },
      });

      await tx.authEvent.create({
        data: {
          ipAddress: context.ipAddress,
          metadata: {
            email,
            name: input.name ?? null,
            otpId: createdOtp.id,
            source: AUTH_SOURCES.REGISTER_ENDPOINT,
          },
          mobile: input.mobile,
          type: "SIGNUP_STARTED",
          userAgent: context.userAgent,
        },
      });

      return {
        status: "otp_created" as const,
        otp: createdOtp,
      };
    });

    if (otpRecord.status === "account_exists") {
      return authError({
        code: AUTH_CODES.ACCOUNT_ALREADY_EXISTS,
        message: AUTH_MESSAGES.ACCOUNT_ALREADY_EXISTS,
        status: HTTP_STATUS.CONFLICT,
      });
    }

    if (otpRecord.status === "retry_later") {
      return authJson({
        code: AUTH_CODES.OTP_RETRY_LATER,
        data: {
          expiresAt: otpRecord.recentOtp.expiresAt,
          mobile: otpRecord.recentOtp.mobile,
          retryAfter: getRetryAfterSeconds(otpRecord.recentOtp.createdAt, now),
        },
        message: AUTH_MESSAGES.OTP_RETRY_LATER,
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        success: false,
      });
    }

    return authJson({
      code: AUTH_CODES.SIGNUP_OTP_SENT,
      data: {
        devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
        expiresAt: otpRecord.otp.expiresAt,
        mobile: otpRecord.otp.mobile,
        retryAfter: otpRecord.otp.retryAfter,
      },
      message: AUTH_MESSAGES.SIGNUP_OTP_SENT,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    console.error(AUTH_CODES.SIGNUP_OTP_FAILED, {
      error,
      handler: "startSignupOtp",
      mobile: input.mobile,
    });

    return authError({
      code: AUTH_CODES.SIGNUP_OTP_FAILED,
      message: AUTH_MESSAGES.SIGNUP_OTP_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

function getRequestContext(request: Request) {
  return {
    ipAddress: getClientIp(request),
    userAgent:
      request.headers
        .get("user-agent")
        ?.slice(0, AUTH_OTP_CONFIG.USER_AGENT_MAX_LENGTH) ?? null,
  };
}

function getClientIp(request: Request) {
  const directIp =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("true-client-ip") ??
    request.headers.get("x-real-ip");

  if (directIp) {
    return directIp.trim() || null;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return null;
}

function getRetryAfterSeconds(createdAt: Date, now: Date) {
  return Math.max(
    1,
    Math.ceil(
      (createdAt.getTime() +
        AUTH_OTP_CONFIG.RETRY_AFTER_SECONDS * 1000 -
        now.getTime()) /
        1000,
    ),
  );
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
  const secret = process.env.AUTH_OTP_SECRET ?? process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_OTP_SECRET is required.");
  }

  return createHash("sha256")
    .update(`${mobile}:${otp}:${secret}`)
    .digest("hex");
}
