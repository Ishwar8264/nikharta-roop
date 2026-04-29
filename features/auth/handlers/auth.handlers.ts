import { getDb } from "@/db";
import {
  AUTH_CODES,
  AUTH_MESSAGES,
  AUTH_OTP_CONFIG,
  AUTH_SESSION_CONFIG,
  AUTH_SOURCES,
} from "@/features/auth/constants/auth.constants";
import {
  generateAuthToken,
  generateOtp,
  hashAuthToken,
  hashOtp,
} from "@/features/auth/helpers/auth.crypto";
import { parseJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import { authError, authJson } from "@/features/auth/responses/auth.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  registerSchema,
  type RegisterInput,
  verifyRegisterSchema,
  type VerifyRegisterInput,
} from "@/schema/auth/schema.auth";

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
 * Handles signup OTP verification.
 *
 * This is the only signup endpoint that creates a user and starts a session.
 */
export async function handleVerifyRegister(request: Request) {
  const parsedBody = await parseJsonBody(request, verifyRegisterSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return verifySignupOtp(parsedBody.data, getRequestContext(request));
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
  const otpSecret = getAuthSecret();
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
          otpHash: hashOtp(input.mobile, otp, otpSecret),
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

async function verifySignupOtp(
  input: VerifyRegisterInput,
  context: RequestContext,
) {
  const db = getDb();
  const now = new Date();
  const otpSecret = getAuthSecret();
  const sessionToken = generateAuthToken();
  const refreshToken = generateAuthToken();
  const sessionExpiresAt = new Date(
    now.getTime() + AUTH_SESSION_CONFIG.EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
  );

  try {
    const result = await db.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        select: {
          id: true,
        },
        where: {
          mobile: input.mobile,
        },
      });

      if (existingUser) {
        return {
          status: "account_exists" as const,
        };
      }

      const otpRecord = await tx.authOtp.findFirst({
        orderBy: {
          createdAt: "desc",
        },
        where: {
          mobile: input.mobile,
          purpose: AUTH_OTP_CONFIG.PURPOSE_SIGNUP,
        },
      });

      if (!otpRecord || otpRecord.verifiedAt) {
        return {
          status: "otp_not_found" as const,
        };
      }

      if (otpRecord.lockedUntil && otpRecord.lockedUntil > now) {
        return {
          status: "otp_locked" as const,
        };
      }

      if (otpRecord.expiresAt <= now) {
        return {
          status: "otp_expired" as const,
        };
      }

      const submittedOtpHash = hashOtp(input.mobile, input.otp, otpSecret);

      if (submittedOtpHash !== otpRecord.otpHash) {
        const attemptCount = otpRecord.attemptCount + 1;
        const isLocked = attemptCount >= otpRecord.maxAttempts;

        await tx.authOtp.update({
          data: {
            attemptCount,
            lockedUntil: isLocked
              ? new Date(
                  now.getTime() + AUTH_OTP_CONFIG.LOCKED_FOR_MINUTES * 60 * 1000,
                )
              : null,
          },
          where: {
            id: otpRecord.id,
          },
        });

        await tx.authEvent.create({
          data: {
            ipAddress: context.ipAddress,
            metadata: {
              attemptCount,
              otpId: otpRecord.id,
              source: AUTH_SOURCES.REGISTER_VERIFY_ENDPOINT,
            },
            mobile: input.mobile,
            type: "OTP_FAILED",
            userAgent: context.userAgent,
          },
        });

        return {
          status: isLocked ? ("otp_locked" as const) : ("otp_invalid" as const),
        };
      }

      const metadata = getSignupOtpMetadata(otpRecord.metadata);
      const user = await tx.user.create({
        data: {
          email: metadata.email,
          mobile: input.mobile,
          mobileVerifiedAt: now,
          name: metadata.name,
          role: "USER",
        },
        select: {
          email: true,
          id: true,
          mobile: true,
          mobileVerifiedAt: true,
          name: true,
          role: true,
        },
      });

      await tx.authOtp.update({
        data: {
          userId: user.id,
          verifiedAt: now,
        },
        where: {
          id: otpRecord.id,
        },
      });

      const session = await tx.authSession.create({
        data: {
          expiresAt: sessionExpiresAt,
          ipAddress: context.ipAddress,
          lastUsedAt: now,
          refreshTokenId: hashAuthToken(refreshToken, otpSecret),
          tokenId: hashAuthToken(sessionToken, otpSecret),
          userAgent: context.userAgent,
          userId: user.id,
        },
        select: {
          expiresAt: true,
          id: true,
        },
      });

      await tx.authEvent.createMany({
        data: [
          {
            ipAddress: context.ipAddress,
            metadata: {
              otpId: otpRecord.id,
              source: AUTH_SOURCES.REGISTER_VERIFY_ENDPOINT,
            },
            mobile: input.mobile,
            type: "OTP_VERIFIED",
            userAgent: context.userAgent,
            userId: user.id,
          },
          {
            ipAddress: context.ipAddress,
            metadata: {
              sessionId: session.id,
              source: AUTH_SOURCES.REGISTER_VERIFY_ENDPOINT,
            },
            mobile: input.mobile,
            type: "SIGNUP_COMPLETED",
            userAgent: context.userAgent,
            userId: user.id,
          },
        ],
      });

      return {
        session,
        status: "signup_completed" as const,
        user,
      };
    });

    if (result.status === "account_exists") {
      return authError({
        code: AUTH_CODES.ACCOUNT_ALREADY_EXISTS,
        message: AUTH_MESSAGES.ACCOUNT_ALREADY_EXISTS,
        status: HTTP_STATUS.CONFLICT,
      });
    }

    if (result.status === "otp_not_found") {
      return authError({
        code: AUTH_CODES.OTP_NOT_FOUND,
        message: AUTH_MESSAGES.OTP_NOT_FOUND,
        status: HTTP_STATUS.GONE,
      });
    }

    if (result.status === "otp_expired") {
      return authError({
        code: AUTH_CODES.OTP_EXPIRED,
        message: AUTH_MESSAGES.OTP_EXPIRED,
        status: HTTP_STATUS.GONE,
      });
    }

    if (result.status === "otp_locked") {
      return authError({
        code: AUTH_CODES.OTP_LOCKED,
        message: AUTH_MESSAGES.OTP_LOCKED,
        status: HTTP_STATUS.LOCKED,
      });
    }

    if (result.status === "otp_invalid") {
      return authError({
        code: AUTH_CODES.OTP_INVALID,
        message: AUTH_MESSAGES.OTP_INVALID,
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    if (result.status !== "signup_completed") {
      return authError({
        code: AUTH_CODES.SIGNUP_VERIFY_FAILED,
        message: AUTH_MESSAGES.SIGNUP_VERIFY_FAILED,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    }

    return authJson({
      code: AUTH_CODES.SIGNUP_COMPLETED,
      data: {
        refreshToken,
        session: {
          expiresAt: result.session.expiresAt,
          id: result.session.id,
        },
        sessionToken,
        user: result.user,
      },
      message: AUTH_MESSAGES.SIGNUP_COMPLETED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    console.error(AUTH_CODES.SIGNUP_VERIFY_FAILED, {
      error,
      handler: "verifySignupOtp",
      mobile: input.mobile,
    });

    return authError({
      code: AUTH_CODES.SIGNUP_VERIFY_FAILED,
      message: AUTH_MESSAGES.SIGNUP_VERIFY_FAILED,
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

function getAuthSecret() {
  const secret = process.env.AUTH_OTP_SECRET ?? process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_OTP_SECRET is required.");
  }

  return secret;
}

function getSignupOtpMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {
      email: null,
      name: null,
    };
  }

  const value = metadata as Record<string, unknown>;

  return {
    email: typeof value.email === "string" && value.email ? value.email : null,
    name: typeof value.name === "string" && value.name ? value.name : null,
  };
}
