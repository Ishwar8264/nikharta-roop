import { NextResponse } from "next/server";

import {
  AUTH_CODES,
  AUTH_MESSAGES,
  AUTH_OTP_CONFIG,
} from "@/features/auth/constants/auth.constants";
import {
  USER_CODES,
  USER_MESSAGES,
} from "@/features/users/constants/user.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OpenApiRecord = Record<string, unknown>;

/**
 * Wraps a successful endpoint payload in the shared API response shape.
 */
function successResponse(input: {
  codeExample: string;
  dataSchema: OpenApiRecord;
  messageExample: string;
}): OpenApiRecord {
  return {
    type: "object",
    required: ["success", "code", "message", "data"],
    properties: {
      success: { type: "boolean", example: true },
      code: { type: "string", example: input.codeExample },
      message: {
        type: "string",
        example: input.messageExample,
      },
      data: input.dataSchema,
    },
  };
}

/**
 * Describes the shared API error response shape.
 */
function errorResponse(): OpenApiRecord {
  return {
    type: "object",
    required: ["success", "code", "message", "data"],
    properties: {
      success: { type: "boolean", example: false },
      code: { type: "string", example: AUTH_CODES.VALIDATION_ERROR },
      message: {
        type: "string",
        example: AUTH_MESSAGES.INVALID_MOBILE,
      },
      data: { nullable: true, example: null },
    },
  };
}

const signupOtpDataSchema: OpenApiRecord = {
  type: "object",
  required: ["mobile", "retryAfter", "expiresAt"],
  properties: {
    mobile: { type: "string", example: "9876543210" },
    retryAfter: {
      type: "integer",
      example: AUTH_OTP_CONFIG.RETRY_AFTER_SECONDS,
      description: "Seconds before OTP resend should be allowed.",
    },
    expiresAt: { type: "string", format: "date-time" },
    devOtp: {
      type: "string",
      nullable: true,
      example: "123456",
      description:
        "Returned only outside production for local testing before SMS integration.",
    },
  },
};

const authUserProperties: OpenApiRecord = {
    id: { type: "string", example: "cmokabtp40001fjw9ghgo2zv7" },
    mobile: { type: "string", example: "9876543210" },
    name: { type: "string", nullable: true, example: "Priya" },
    email: {
      type: "string",
      nullable: true,
      example: "priya@example.com",
    },
    role: { type: "string", example: "USER" },
    mobileVerifiedAt: { type: "string", format: "date-time" },
};

const authUserDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "mobile", "role", "mobileVerifiedAt"],
  properties: authUserProperties,
};

const profileUserDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "mobile", "role", "mobileVerifiedAt"],
  properties: {
    ...authUserProperties,
    avatarUrl: {
      type: "string",
      nullable: true,
      example: "https://cdn.example.com/avatar.jpg",
    },
    branchId: {
      type: "string",
      nullable: true,
      example: "cmokbranch0001",
    },
    profileCompletedAt: {
      type: "string",
      format: "date-time",
      nullable: true,
    },
  },
};

const signupVerifyDataSchema: OpenApiRecord = {
  type: "object",
  required: ["user", "session", "sessionToken", "refreshToken"],
  properties: {
    user: authUserDataSchema,
    session: {
      type: "object",
      required: ["id", "expiresAt"],
      properties: {
        id: { type: "string", example: "cmokabtp40002fjw9v6ehw21x" },
        expiresAt: { type: "string", format: "date-time" },
      },
    },
    sessionToken: {
      type: "string",
      description:
        "Opaque bearer token. Also set as an HttpOnly cookie for browser clients.",
    },
    refreshToken: {
      type: "string",
      description:
        "Opaque refresh token. Also set as an HttpOnly cookie for browser clients.",
    },
  },
};

const mobileRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["mobile"],
  properties: {
    mobile: {
      type: "string",
      pattern: "^[6-9]\\d{9}$",
      example: "9876543210",
    },
  },
};

const otpRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["mobile", "otp"],
  properties: {
    mobile: {
      type: "string",
      pattern: "^[6-9]\\d{9}$",
      example: "9876543210",
    },
    otp: {
      type: "string",
      pattern: "^\\d{6}$",
      example: "123456",
    },
  },
};

const refreshRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["refreshToken"],
  properties: {
    refreshToken: {
      type: "string",
      example: "opaque-refresh-token",
    },
  },
};

const sessionsDataSchema: OpenApiRecord = {
  type: "object",
  required: ["currentSessionId", "sessions"],
  properties: {
    currentSessionId: { type: "string" },
    sessions: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "expiresAt", "createdAt"],
        properties: {
          id: { type: "string" },
          deviceName: { type: "string", nullable: true },
          ipAddress: { type: "string", nullable: true },
          userAgent: { type: "string", nullable: true },
          lastUsedAt: { type: "string", format: "date-time", nullable: true },
          expiresAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

const sessionIdDataSchema: OpenApiRecord = {
  type: "object",
  required: ["sessionId"],
  properties: {
    sessionId: { type: "string" },
  },
};

/**
 * Creates an OpenAPI JSON endpoint definition.
 */
function jsonEndpoint(input: {
  description: string;
  failureDescription?: string;
  method?: "delete" | "get" | "patch" | "post";
  requestSchema?: OpenApiRecord;
  requestBodyRequired?: boolean;
  requiresAuth?: boolean;
  responseSchema: OpenApiRecord;
  successCode: string;
  successDescription?: string;
  successMessage: string;
  successStatus?: number;
  summary: string;
}): OpenApiRecord {
  const method = input.method ?? "post";
  const successStatus = input.successStatus ?? HTTP_STATUS.CREATED;

  return {
    [method]: {
      tags: ["Auth"],
      summary: input.summary,
      description: input.description,
      ...(input.requiresAuth ? { security: [{ bearerAuth: [] }] } : {}),
      ...(input.requestSchema
        ? {
            requestBody: {
              required: input.requestBodyRequired ?? true,
              content: {
                "application/json": {
                  schema: input.requestSchema,
                },
              },
            },
          }
        : {}),
      responses: {
        [successStatus]: {
          description: input.successDescription ?? "Success.",
          content: {
            "application/json": {
              schema: successResponse({
                codeExample: input.successCode,
                dataSchema: input.responseSchema,
                messageExample: input.successMessage,
              }),
            },
          },
        },
        [HTTP_STATUS.TOO_MANY_REQUESTS]: {
          description: "OTP resend cooldown is active.",
          content: {
            "application/json": {
              schema: errorResponse(),
            },
          },
        },
        [HTTP_STATUS.CONFLICT]: {
          description: "Account already exists.",
          content: {
            "application/json": {
              schema: errorResponse(),
            },
          },
        },
        [HTTP_STATUS.GONE]: {
          description: "OTP is missing or expired.",
          content: {
            "application/json": {
              schema: errorResponse(),
            },
          },
        },
        [HTTP_STATUS.LOCKED]: {
          description: "OTP attempts are locked.",
          content: {
            "application/json": {
              schema: errorResponse(),
            },
          },
        },
        [HTTP_STATUS.UNAUTHORIZED]: {
          description: "OTP is invalid.",
          content: {
            "application/json": {
              schema: errorResponse(),
            },
          },
        },
        [HTTP_STATUS.UNPROCESSABLE_ENTITY]: {
          description: "Request validation failed.",
          content: {
            "application/json": {
              schema: errorResponse(),
            },
          },
        },
        [HTTP_STATUS.INTERNAL_SERVER_ERROR]: {
          description: input.failureDescription ?? "Registration failed.",
          content: {
            "application/json": {
              schema: errorResponse(),
            },
          },
        },
      },
    },
  };
}

/**
 * Returns the static OpenAPI document used by Swagger UI.
 */
export function GET(request: Request) {
  const origin = new URL(request.url).origin;

  return NextResponse.json(
    {
      openapi: "3.1.0",
      info: {
        title: "Nikharta Roop Auth API",
        version: "1.0.0",
        description:
          "Mobile-first auth API for Nikharta Roop. Register starts signup OTP; verification creates the account and session later.",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
          },
        },
      },
      servers: [{ url: origin }],
      paths: {
        "/api/v1/auth/register": jsonEndpoint({
          summary: "Register",
          description:
            "Start signup by sending an OTP to a 10-digit Indian mobile number. This endpoint does not create a user, select a branch, upload an avatar, or set a password.",
          requestSchema: {
            type: "object",
            additionalProperties: false,
            required: ["mobile"],
            properties: {
              mobile: {
                type: "string",
                pattern: "^[6-9]\\d{9}$",
                example: "9876543210",
              },
              name: {
                type: "string",
                minLength: 2,
                maxLength: 100,
                example: "Priya",
              },
              email: {
                type: "string",
                format: "email",
                maxLength: 150,
                example: "priya@example.com",
              },
            },
          },
          responseSchema: signupOtpDataSchema,
          successCode: AUTH_CODES.SIGNUP_OTP_SENT,
          successDescription: "Signup OTP challenge created.",
          successMessage: AUTH_MESSAGES.SIGNUP_OTP_SENT,
        }),
        "/api/v1/auth/register/verify": jsonEndpoint({
          summary: "Verify registration OTP",
          description:
            "Verify the signup OTP, create the user account, mark the mobile number as verified, and start an auth session.",
          failureDescription: "Signup OTP verification failed.",
          requestSchema: {
            type: "object",
            additionalProperties: false,
            required: ["mobile", "otp"],
            properties: {
              mobile: {
                type: "string",
                pattern: "^[6-9]\\d{9}$",
                example: "9876543210",
              },
              otp: {
                type: "string",
                pattern: "^\\d{6}$",
                example: "123456",
              },
            },
          },
          responseSchema: signupVerifyDataSchema,
          successCode: AUTH_CODES.SIGNUP_COMPLETED,
          successDescription: "Account created and session started.",
          successMessage: AUTH_MESSAGES.SIGNUP_COMPLETED,
        }),
        "/api/v1/auth/login": jsonEndpoint({
          summary: "Login",
          description:
            "Send a login OTP to an existing active user. This endpoint never creates a user.",
          failureDescription: "Login OTP request failed.",
          requestSchema: mobileRequestSchema,
          responseSchema: signupOtpDataSchema,
          successCode: AUTH_CODES.LOGIN_OTP_SENT,
          successDescription: "Login OTP challenge created.",
          successMessage: AUTH_MESSAGES.LOGIN_OTP_SENT,
        }),
        "/api/v1/auth/login/verify": jsonEndpoint({
          summary: "Verify login OTP",
          description:
            "Verify the login OTP and create a new auth session for the existing user.",
          failureDescription: "Login OTP verification failed.",
          requestSchema: otpRequestSchema,
          responseSchema: signupVerifyDataSchema,
          successCode: AUTH_CODES.LOGIN_COMPLETED,
          successDescription: "Login session created.",
          successMessage: AUTH_MESSAGES.LOGIN_COMPLETED,
        }),
        "/api/v1/auth/refresh": jsonEndpoint({
          summary: "Refresh session",
          description:
            "Rotate the refresh token and issue a fresh session token. Browser clients can rely on the HttpOnly refresh cookie; API clients can send refreshToken in the JSON body.",
          failureDescription: "Session refresh failed.",
          requestSchema: refreshRequestSchema,
          requestBodyRequired: false,
          responseSchema: signupVerifyDataSchema,
          successCode: AUTH_CODES.SESSION_REFRESHED,
          successDescription: "Session refreshed.",
          successMessage: AUTH_MESSAGES.SESSION_REFRESHED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/auth/me": jsonEndpoint({
          method: "get",
          summary: "Current user",
          description: "Return the current authenticated user.",
          requiresAuth: true,
          responseSchema: {
            type: "object",
            required: ["user"],
            properties: {
              user: authUserDataSchema,
            },
          },
          successCode: AUTH_CODES.ME_LOADED,
          successDescription: "Current user loaded.",
          successMessage: AUTH_MESSAGES.ME_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/auth/logout": jsonEndpoint({
          summary: "Logout",
          description: "Revoke the current auth session.",
          requiresAuth: true,
          responseSchema: sessionIdDataSchema,
          successCode: AUTH_CODES.LOGOUT_COMPLETED,
          successDescription: "Current session revoked.",
          successMessage: AUTH_MESSAGES.LOGOUT_COMPLETED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/auth/sessions": jsonEndpoint({
          method: "get",
          summary: "List sessions",
          description: "List active sessions for the current authenticated user.",
          requiresAuth: true,
          responseSchema: sessionsDataSchema,
          successCode: AUTH_CODES.SESSIONS_LOADED,
          successDescription: "Active sessions loaded.",
          successMessage: AUTH_MESSAGES.SESSIONS_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/auth/sessions/{sessionId}": jsonEndpoint({
          method: "delete",
          summary: "Revoke session",
          description: "Revoke one active session owned by the current user.",
          requiresAuth: true,
          responseSchema: sessionIdDataSchema,
          successCode: AUTH_CODES.SESSION_REVOKED,
          successDescription: "Session revoked.",
          successMessage: AUTH_MESSAGES.SESSION_REVOKED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/users/me/profile": jsonEndpoint({
          method: "patch",
          summary: "Update profile",
          description:
            "Update editable profile fields for the current authenticated user. This endpoint does not change mobile number, role, branch, avatar upload, or session tokens.",
          failureDescription: "Profile update failed.",
          requiresAuth: true,
          requestSchema: {
            type: "object",
            additionalProperties: false,
            minProperties: 1,
            properties: {
              name: {
                type: "string",
                minLength: 2,
                maxLength: 100,
                example: "Priya",
              },
              email: {
                type: "string",
                format: "email",
                nullable: true,
                maxLength: 150,
                example: "priya@example.com",
              },
            },
          },
          responseSchema: {
            type: "object",
            required: ["user"],
            properties: {
              user: profileUserDataSchema,
            },
          },
          successCode: USER_CODES.PROFILE_UPDATED,
          successDescription: "Profile updated.",
          successMessage: USER_MESSAGES.PROFILE_UPDATED,
          successStatus: HTTP_STATUS.OK,
        }),
      },
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
