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
import {
  AUTH_COOKIE_NAMES,
  createAuthCookieHeaders,
  createClearAuthCookieHeaders,
  getCookieValue,
  headersWithSetCookies,
} from "@/features/auth/helpers/auth.cookies";
import { getDeviceName } from "@/features/auth/helpers/auth.device";
import { parseJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import { authError, authJson } from "@/features/auth/responses/auth.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  loginSchema,
  type LoginInput,
  registerSchema,
  refreshSessionSchema,
  type RefreshSessionInput,
  type RegisterInput,
  verifyLoginSchema,
  type VerifyLoginInput,
  verifyRegisterSchema,
  type VerifyRegisterInput,
} from "@/schema/auth/schema.auth";

type RequestContext = {
  ipAddress: string | null;
  refreshTokenCookie: string | null;
  userAgent: string | null;
};

type PublicUserRow = {
  email: string | null;
  id: string;
  isActive: boolean;
  mobile: string;
  mobileVerifiedAt: Date | null;
  name: string | null;
  role: string;
};

type AuthTokenPair = {
  refreshToken: string;
  sessionToken: string;
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
 * Sends a login OTP to an existing active user.
 */
export async function handleLogin(request: Request) {
  const parsedBody = await parseJsonBody(request, loginSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return startLoginOtp(parsedBody.data, getRequestContext(request));
}

/**
 * Verifies a login OTP and creates a new auth session.
 */
export async function handleVerifyLogin(request: Request) {
  const parsedBody = await parseJsonBody(request, verifyLoginSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return verifyLoginOtp(parsedBody.data, getRequestContext(request));
}

/**
 * Returns the current authenticated user.
 */
export async function handleMe(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  await touchSession(auth.session.id);

  return authJson({
    code: AUTH_CODES.ME_LOADED,
    data: {
      user: auth.session.user,
    },
    message: AUTH_MESSAGES.ME_LOADED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}

/**
 * Lists active sessions for the current user.
 */
export async function handleListSessions(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  const sessions = await getDb().authSession.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      createdAt: true,
      deviceName: true,
      expiresAt: true,
      id: true,
      ipAddress: true,
      lastUsedAt: true,
      userAgent: true,
    },
    where: {
      expiresAt: {
        gt: new Date(),
      },
      revokedAt: null,
      userId: auth.session.userId,
    },
  });

  return authJson({
    code: AUTH_CODES.SESSIONS_LOADED,
    data: {
      currentSessionId: auth.session.id,
      sessions,
    },
    message: AUTH_MESSAGES.SESSIONS_LOADED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}

/**
 * Revokes the current session.
 */
export async function handleLogout(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  await revokeSession(auth.session.id, AUTH_SOURCES.LOGOUT_ENDPOINT);

  return authJson({
    code: AUTH_CODES.LOGOUT_COMPLETED,
    data: {
      sessionId: auth.session.id,
    },
    headers: headersWithSetCookies(createClearAuthCookieHeaders()),
    message: AUTH_MESSAGES.LOGOUT_COMPLETED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}

/**
 * Rotates session and refresh tokens.
 */
export async function handleRefreshSession(request: Request) {
  const parsedBody = await parseJsonBody(request, refreshSessionSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return refreshSession(parsedBody.data, getRequestContext(request));
}

/**
 * Revokes a session owned by the current user.
 */
export async function handleRevokeSession(request: Request, sessionId: string) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  const session = await getDb().authSession.findFirst({
    select: {
      id: true,
    },
    where: {
      id: sessionId,
      revokedAt: null,
      userId: auth.session.userId,
    },
  });

  if (!session) {
    return authError({
      code: AUTH_CODES.SESSION_NOT_FOUND,
      message: AUTH_MESSAGES.SESSION_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    });
  }

  await revokeSession(session.id, AUTH_SOURCES.REVOKE_SESSION_ENDPOINT);

  return authJson({
    code: AUTH_CODES.SESSION_REVOKED,
    data: {
      sessionId: session.id,
    },
    message: AUTH_MESSAGES.SESSION_REVOKED,
    status: HTTP_STATUS.OK,
    success: true,
  });
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

/**
 * Completes signup after OTP verification.
 *
 * The user, verified OTP, session, and audit events are written in one
 * transaction so a partially-created account cannot leak out.
 */
async function verifySignupOtp(
  input: VerifyRegisterInput,
  context: RequestContext,
) {
  const db = getDb();
  const now = new Date();
  const otpSecret = getAuthSecret();
  const tokens = generateAuthTokens();
  const sessionExpiresAt = getSessionExpiry(now);

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
          deviceName: getDeviceName(context.userAgent),
          expiresAt: sessionExpiresAt,
          ipAddress: context.ipAddress,
          lastUsedAt: now,
          refreshTokenId: hashAuthToken(tokens.refreshToken, otpSecret),
          tokenId: hashAuthToken(tokens.sessionToken, otpSecret),
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
        refreshToken: tokens.refreshToken,
        session: {
          expiresAt: result.session.expiresAt,
          id: result.session.id,
        },
        sessionToken: tokens.sessionToken,
        user: result.user,
      },
      headers: createAuthHeaders(tokens, result.session.expiresAt),
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

/**
 * Starts login by issuing an OTP for an existing active user.
 *
 * It intentionally rejects unknown mobiles instead of creating accounts,
 * keeping signup and login semantics separate.
 */
async function startLoginOtp(input: LoginInput, context: RequestContext) {
  const db = getDb();
  const otp = generateOtp();
  const otpSecret = getAuthSecret();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + AUTH_OTP_CONFIG.EXPIRES_IN_MINUTES * 60 * 1000,
  );

  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        select: {
          id: true,
          isActive: true,
          mobile: true,
        },
        where: {
          mobile: input.mobile,
        },
      });

      if (!user) {
        return {
          status: "account_not_found" as const,
        };
      }

      if (!user.isActive) {
        return {
          status: "account_inactive" as const,
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
          purpose: AUTH_OTP_CONFIG.PURPOSE_LOGIN,
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
          purpose: AUTH_OTP_CONFIG.PURPOSE_LOGIN,
          verifiedAt: null,
        },
      });

      const createdOtp = await tx.authOtp.create({
        data: {
          expiresAt,
          ipAddress: context.ipAddress,
          metadata: {
            source: AUTH_SOURCES.LOGIN_ENDPOINT,
          },
          mobile: input.mobile,
          otpHash: hashOtp(input.mobile, otp, otpSecret),
          purpose: AUTH_OTP_CONFIG.PURPOSE_LOGIN,
          retryAfter: AUTH_OTP_CONFIG.RETRY_AFTER_SECONDS,
          userAgent: context.userAgent,
          userId: user.id,
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
            otpId: createdOtp.id,
            source: AUTH_SOURCES.LOGIN_ENDPOINT,
          },
          mobile: input.mobile,
          type: "OTP_REQUESTED",
          userAgent: context.userAgent,
          userId: user.id,
        },
      });

      return {
        otp: createdOtp,
        status: "otp_created" as const,
      };
    });

    if (result.status === "account_not_found") {
      return authError({
        code: AUTH_CODES.ACCOUNT_NOT_FOUND,
        message: AUTH_MESSAGES.ACCOUNT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    if (result.status === "account_inactive") {
      return authError({
        code: AUTH_CODES.ACCOUNT_INACTIVE,
        message: AUTH_MESSAGES.ACCOUNT_INACTIVE,
        status: HTTP_STATUS.FORBIDDEN,
      });
    }

    if (result.status === "retry_later") {
      return authJson({
        code: AUTH_CODES.OTP_RETRY_LATER,
        data: {
          expiresAt: result.recentOtp.expiresAt,
          mobile: result.recentOtp.mobile,
          retryAfter: getRetryAfterSeconds(result.recentOtp.createdAt, now),
        },
        message: AUTH_MESSAGES.OTP_RETRY_LATER,
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        success: false,
      });
    }

    return authJson({
      code: AUTH_CODES.LOGIN_OTP_SENT,
      data: {
        devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
        expiresAt: result.otp.expiresAt,
        mobile: result.otp.mobile,
        retryAfter: result.otp.retryAfter,
      },
      message: AUTH_MESSAGES.LOGIN_OTP_SENT,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    console.error(AUTH_CODES.LOGIN_OTP_FAILED, {
      error,
      handler: "startLoginOtp",
      mobile: input.mobile,
    });

    return authError({
      code: AUTH_CODES.LOGIN_OTP_FAILED,
      message: AUTH_MESSAGES.LOGIN_OTP_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Completes login after OTP verification.
 *
 * Successful verification marks the OTP used, updates last login time, creates
 * a fresh session, and records audit events inside a single transaction.
 */
async function verifyLoginOtp(
  input: VerifyLoginInput,
  context: RequestContext,
) {
  const db = getDb();
  const now = new Date();
  const otpSecret = getAuthSecret();
  const tokens = generateAuthTokens();
  const sessionExpiresAt = getSessionExpiry(now);

  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        select: {
          email: true,
          id: true,
          isActive: true,
          mobile: true,
          mobileVerifiedAt: true,
          name: true,
          role: true,
        },
        where: {
          mobile: input.mobile,
        },
      });

      if (!user) {
        return {
          status: "account_not_found" as const,
        };
      }

      if (!user.isActive) {
        return {
          status: "account_inactive" as const,
        };
      }

      const otpRecord = await tx.authOtp.findFirst({
        orderBy: {
          createdAt: "desc",
        },
        where: {
          mobile: input.mobile,
          purpose: AUTH_OTP_CONFIG.PURPOSE_LOGIN,
          userId: user.id,
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
              source: AUTH_SOURCES.LOGIN_VERIFY_ENDPOINT,
            },
            mobile: input.mobile,
            type: "OTP_FAILED",
            userAgent: context.userAgent,
            userId: user.id,
          },
        });

        return {
          status: isLocked ? ("otp_locked" as const) : ("otp_invalid" as const),
        };
      }

      await tx.authOtp.update({
        data: {
          verifiedAt: now,
        },
        where: {
          id: otpRecord.id,
        },
      });

      await tx.user.update({
        data: {
          lastLoginAt: now,
        },
        where: {
          id: user.id,
        },
      });

      const session = await tx.authSession.create({
        data: {
          deviceName: getDeviceName(context.userAgent),
          expiresAt: sessionExpiresAt,
          ipAddress: context.ipAddress,
          lastUsedAt: now,
          refreshTokenId: hashAuthToken(tokens.refreshToken, otpSecret),
          tokenId: hashAuthToken(tokens.sessionToken, otpSecret),
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
              source: AUTH_SOURCES.LOGIN_VERIFY_ENDPOINT,
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
              source: AUTH_SOURCES.LOGIN_VERIFY_ENDPOINT,
            },
            mobile: input.mobile,
            type: "LOGIN_COMPLETED",
            userAgent: context.userAgent,
            userId: user.id,
          },
        ],
      });

      return {
        session,
        status: "login_completed" as const,
        user: toPublicUser(user),
      };
    });

    const earlyResponse = otpFailureResponse(result.status);

    if (earlyResponse) {
      return earlyResponse;
    }

    if (result.status !== "login_completed") {
      return authError({
        code: AUTH_CODES.LOGIN_VERIFY_FAILED,
        message: AUTH_MESSAGES.LOGIN_VERIFY_FAILED,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    }

    return authJson({
      code: AUTH_CODES.LOGIN_COMPLETED,
      data: {
        refreshToken: tokens.refreshToken,
        session: result.session,
        sessionToken: tokens.sessionToken,
        user: result.user,
      },
      headers: createAuthHeaders(tokens, result.session.expiresAt),
      message: AUTH_MESSAGES.LOGIN_COMPLETED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    console.error(AUTH_CODES.LOGIN_VERIFY_FAILED, {
      error,
      handler: "verifyLoginOtp",
      mobile: input.mobile,
    });

    return authError({
      code: AUTH_CODES.LOGIN_VERIFY_FAILED,
      message: AUTH_MESSAGES.LOGIN_VERIFY_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Rotates a refresh token and session token.
 *
 * Browser clients can use the HttpOnly refresh cookie, while API/mobile
 * clients can continue sending the refresh token in the request body.
 */
async function refreshSession(
  input: RefreshSessionInput,
  context: RequestContext,
) {
  const db = getDb();
  const now = new Date();
  const secret = getAuthSecret();
  const submittedRefreshToken =
    input.refreshToken ?? context.refreshTokenCookie;

  if (!submittedRefreshToken) {
    return authError({
      code: AUTH_CODES.AUTH_REQUIRED,
      message: AUTH_MESSAGES.INVALID_REFRESH_TOKEN,
      status: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  const refreshTokenHash = hashAuthToken(submittedRefreshToken, secret);
  const tokens = generateAuthTokens();
  const expiresAt = getSessionExpiry(now);

  const session = await db.authSession.findUnique({
    include: {
      user: {
        select: publicUserSelect(),
      },
    },
    where: {
      refreshTokenId: refreshTokenHash,
    },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= now ||
    !session.user.isActive
  ) {
    return authError({
      code: AUTH_CODES.AUTH_REQUIRED,
      message: AUTH_MESSAGES.INVALID_REFRESH_TOKEN,
      status: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  const updatedSession = await db.authSession.update({
    data: {
      deviceName: getDeviceName(context.userAgent),
      expiresAt,
      ipAddress: context.ipAddress,
      lastUsedAt: now,
      refreshTokenId: hashAuthToken(tokens.refreshToken, secret),
      tokenId: hashAuthToken(tokens.sessionToken, secret),
      userAgent: context.userAgent,
    },
    select: {
      expiresAt: true,
      id: true,
    },
    where: {
      id: session.id,
    },
  });

  return authJson({
    code: AUTH_CODES.SESSION_REFRESHED,
    data: {
      refreshToken: tokens.refreshToken,
      session: updatedSession,
      sessionToken: tokens.sessionToken,
      user: toPublicUser(session.user),
    },
    headers: createAuthHeaders(tokens, updatedSession.expiresAt),
    message: AUTH_MESSAGES.SESSION_REFRESHED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}

/**
 * Converts shared OTP verification statuses into public API errors.
 */
function otpFailureResponse(status: string) {
  if (status === "account_not_found") {
    return authError({
      code: AUTH_CODES.ACCOUNT_NOT_FOUND,
      message: AUTH_MESSAGES.ACCOUNT_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    });
  }

  if (status === "account_inactive") {
    return authError({
      code: AUTH_CODES.ACCOUNT_INACTIVE,
      message: AUTH_MESSAGES.ACCOUNT_INACTIVE,
      status: HTTP_STATUS.FORBIDDEN,
    });
  }

  if (status === "otp_not_found") {
    return authError({
      code: AUTH_CODES.OTP_NOT_FOUND,
      message: AUTH_MESSAGES.OTP_NOT_FOUND,
      status: HTTP_STATUS.GONE,
    });
  }

  if (status === "otp_expired") {
    return authError({
      code: AUTH_CODES.OTP_EXPIRED,
      message: AUTH_MESSAGES.OTP_EXPIRED,
      status: HTTP_STATUS.GONE,
    });
  }

  if (status === "otp_locked") {
    return authError({
      code: AUTH_CODES.OTP_LOCKED,
      message: AUTH_MESSAGES.OTP_LOCKED,
      status: HTTP_STATUS.LOCKED,
    });
  }

  if (status === "otp_invalid") {
    return authError({
      code: AUTH_CODES.OTP_INVALID,
      message: AUTH_MESSAGES.OTP_INVALID,
      status: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  return null;
}

/**
 * Resolves the current session from either a bearer token or HttpOnly cookie.
 */
export async function getAuthenticatedSession(request: Request) {
  const token =
    getBearerToken(request) ??
    getCookieValue(request, AUTH_COOKIE_NAMES.SESSION);

  if (!token) {
    return {
      error: authError({
        code: AUTH_CODES.AUTH_REQUIRED,
        message: AUTH_MESSAGES.AUTH_REQUIRED,
        status: HTTP_STATUS.UNAUTHORIZED,
      }),
      success: false as const,
    };
  }

  const secret = getAuthSecret();
  const session = await getDb().authSession.findUnique({
    include: {
      user: {
        select: publicUserSelect(),
      },
    },
    where: {
      tokenId: hashAuthToken(token, secret),
    },
  });

  const now = new Date();

  if (!session || session.revokedAt || session.expiresAt <= now) {
    return {
      error: authError({
        code: AUTH_CODES.AUTH_REQUIRED,
        message: AUTH_MESSAGES.AUTH_REQUIRED,
        status: HTTP_STATUS.UNAUTHORIZED,
      }),
      success: false as const,
    };
  }

  if (!session.user.isActive) {
    return {
      error: authError({
        code: AUTH_CODES.ACCOUNT_INACTIVE,
        message: AUTH_MESSAGES.ACCOUNT_INACTIVE,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }

  return {
    session: {
      ...session,
      user: toPublicUser(session.user),
    },
    success: true as const,
  };
}

/**
 * Updates session activity after successful authenticated reads.
 */
export async function touchSession(sessionId: string) {
  await getDb().authSession.update({
    data: {
      lastUsedAt: new Date(),
    },
    where: {
      id: sessionId,
    },
  });
}

/**
 * Revokes a session and records the matching audit event.
 */
async function revokeSession(sessionId: string, source: string) {
  const now = new Date();
  const db = getDb();
  const session = await db.authSession.update({
    data: {
      refreshTokenId: null,
      revokedAt: now,
      revokeReason: source,
    },
    include: {
      user: {
        select: {
          id: true,
          mobile: true,
        },
      },
    },
    where: {
      id: sessionId,
    },
  });

  await db.authEvent.create({
    data: {
      metadata: {
        sessionId,
        source,
      },
      mobile: session.user.mobile,
      type:
        source === AUTH_SOURCES.LOGOUT_ENDPOINT
          ? "LOGOUT_COMPLETED"
          : "TOKEN_REVOKED",
      userId: session.user.id,
    },
  });
}

/**
 * Extracts bearer tokens without accepting malformed Authorization headers.
 */
function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

/**
 * Calculates the absolute session expiry from the shared session policy.
 */
function getSessionExpiry(now: Date) {
  return new Date(
    now.getTime() + AUTH_SESSION_CONFIG.EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
  );
}

/**
 * Keeps auth responses from accidentally exposing private User columns.
 */
function publicUserSelect() {
  return {
    email: true,
    id: true,
    isActive: true,
    mobile: true,
    mobileVerifiedAt: true,
    name: true,
    role: true,
  } as const;
}

/**
 * Normalizes selected User rows into the public API user shape.
 */
function toPublicUser(user: PublicUserRow) {
  return {
    email: user.email,
    id: user.id,
    mobile: user.mobile,
    mobileVerifiedAt: user.mobileVerifiedAt,
    name: user.name,
    role: user.role,
  };
}

/**
 * Generates tokens with explicit entropy targets.
 *
 * sessionToken uses 256-bit entropy; refreshToken uses 512-bit entropy.
 */
function generateAuthTokens(): AuthTokenPair {
  return {
    refreshToken: generateAuthToken(64),
    sessionToken: generateAuthToken(32),
  };
}

/**
 * Mirrors response-body tokens into HttpOnly cookies for browser clients.
 */
function createAuthHeaders(tokens: AuthTokenPair, expiresAt: Date) {
  return headersWithSetCookies(
    createAuthCookieHeaders({
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: expiresAt,
      sessionToken: tokens.sessionToken,
      sessionTokenExpiresAt: expiresAt,
    }),
  );
}

/**
 * Captures request metadata used for audit logs, cookies, and device sessions.
 */
function getRequestContext(request: Request) {
  return {
    ipAddress: getClientIp(request),
    refreshTokenCookie: getCookieValue(
      request,
      AUTH_COOKIE_NAMES.REFRESH,
    ),
    userAgent:
      request.headers
        .get("user-agent")
        ?.slice(0, AUTH_OTP_CONFIG.USER_AGENT_MAX_LENGTH) ?? null,
  };
}

/**
 * Reads the best available client IP from common proxy headers.
 */
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

/**
 * Computes remaining OTP cooldown in seconds for client retry UX.
 */
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
 * Loads the server-side auth secret used for hashing OTPs and tokens.
 */
function getAuthSecret() {
  const secret = process.env.AUTH_OTP_SECRET ?? process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_OTP_SECRET is required.");
  }

  return secret;
}

/**
 * Safely extracts optional profile fields from OTP metadata.
 */
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
