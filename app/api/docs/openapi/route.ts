import { NextResponse } from "next/server";

import {
  AUTH_CODES,
  AUTH_MESSAGES,
  AUTH_OTP_CONFIG,
} from "@/features/auth/constants/auth.constants";
import {
  BRANCH_CODES,
  BRANCH_MESSAGES,
} from "@/features/branches/constants/branch.constants";
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
    notificationPreferences: {
      type: "object",
      additionalProperties: true,
      example: {
        bookingReminders: true,
        offers: true,
        whatsapp: true,
      },
    },
  },
};

const branchDataSchema: OpenApiRecord = {
  type: "object",
  required: [
    "id",
    "nameHi",
    "city",
    "address",
    "phone",
    "openTime",
    "closeTime",
    "updatedAt",
  ],
  properties: {
    id: { type: "string", example: "cmokbranch0001" },
    nameHi: { type: "string", example: "निखरता रूप जयपुर" },
    nameEn: {
      type: "string",
      nullable: true,
      example: "Nikharta Roop Jaipur",
    },
    city: { type: "string", example: "Jaipur" },
    address: { type: "string", example: "Main Road, Jaipur" },
    googleMapsUrl: {
      type: "string",
      nullable: true,
      example: "https://maps.google.com/?q=nikharta+roop+jaipur",
    },
    phone: {
      type: "string",
      pattern: "^[6-9]\\d{9}$",
      example: "9876543210",
    },
    openTime: {
      type: "string",
      example: "10:00:00",
      description: "Branch opening time in HH:mm:ss format.",
    },
    closeTime: {
      type: "string",
      example: "19:30:00",
      description: "Branch closing time in HH:mm:ss format.",
    },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const avatarDataSchema: OpenApiRecord = {
  type: "object",
  required: ["avatarUrl", "user"],
  properties: {
    avatarUrl: {
      type: "string",
      nullable: true,
      example: "https://res.cloudinary.com/demo/image/upload/avatar.jpg",
    },
    user: profileUserDataSchema,
  },
};

const addressDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "line1", "city", "isDefault", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string", example: "cmokaddress0001" },
    branchId: { type: "string", nullable: true, example: "cmokbranch0001" },
    label: { type: "string", nullable: true, example: "Home" },
    recipientName: { type: "string", nullable: true, example: "Priya" },
    mobile: { type: "string", nullable: true, example: "9876543210" },
    line1: { type: "string", example: "House 24, Main Road" },
    line2: { type: "string", nullable: true, example: "Near market" },
    landmark: { type: "string", nullable: true, example: "City Mall" },
    city: { type: "string", example: "Jaipur" },
    state: { type: "string", nullable: true, example: "Rajasthan" },
    postalCode: { type: "string", nullable: true, example: "302001" },
    latitude: {
      type: "string",
      nullable: true,
      example: "26.9124000",
      description: "Stored as Decimal and serialized as string.",
    },
    longitude: {
      type: "string",
      nullable: true,
      example: "75.7873000",
      description: "Stored as Decimal and serialized as string.",
    },
    isDefault: { type: "boolean", example: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const addressRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  required: ["line1", "city"],
  properties: {
    branchId: { type: "string", nullable: true, example: "cmokbranch0001" },
    label: { type: "string", nullable: true, maxLength: 80, example: "Home" },
    recipientName: {
      type: "string",
      nullable: true,
      maxLength: 100,
      example: "Priya",
    },
    mobile: {
      type: "string",
      nullable: true,
      pattern: "^[6-9]\\d{9}$",
      example: "9876543210",
    },
    line1: { type: "string", minLength: 3, maxLength: 240 },
    line2: { type: "string", nullable: true, maxLength: 240 },
    landmark: { type: "string", nullable: true, maxLength: 200 },
    city: { type: "string", minLength: 2, maxLength: 100, example: "Jaipur" },
    state: { type: "string", nullable: true, maxLength: 100 },
    postalCode: { type: "string", nullable: true, maxLength: 12 },
    latitude: {
      type: "number",
      nullable: true,
      minimum: -90,
      maximum: 90,
      description: "Accepted as number; returned as Decimal string.",
    },
    longitude: {
      type: "number",
      nullable: true,
      minimum: -180,
      maximum: 180,
      description: "Accepted as number; returned as Decimal string.",
    },
    isDefault: { type: "boolean", example: true },
  },
};

const addressPatchRequestSchema: OpenApiRecord = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: addressRequestSchema.properties,
};

const bookingHistoryItemSchema: OpenApiRecord = {
  type: "object",
  required: [
    "id",
    "displayId",
    "bookingDate",
    "slotStart",
    "slotEnd",
    "status",
    "totalAmount",
    "branch",
    "createdAt",
    "updatedAt",
  ],
  properties: {
    id: { type: "string", example: "cmokbooking0001" },
    displayId: { type: "string", example: "NR-2026-0001" },
    bookingDate: { type: "string", format: "date-time" },
    slotStart: { type: "string", format: "date-time" },
    slotEnd: { type: "string", format: "date-time" },
    status: {
      type: "string",
      enum: [
        "PENDING",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      example: "CONFIRMED",
    },
    totalAmount: { type: "string", example: "1200.00" },
    branch: {
      type: "object",
      required: ["id", "nameHi", "city"],
      properties: {
        id: { type: "string" },
        nameHi: { type: "string", example: "निखरता रूप जयपुर" },
        nameEn: { type: "string", nullable: true, example: "Nikharta Roop Jaipur" },
        city: { type: "string", example: "Jaipur" },
      },
    },
    service: { type: "object", nullable: true },
    serviceVariant: { type: "object", nullable: true },
    package: { type: "object", nullable: true },
    staff: { type: "object", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const authSessionDataSchema: OpenApiRecord = {
  type: "object",
  required: ["id", "expiresAt", "user"],
  properties: {
    id: { type: "string", example: "cmokabtp40002fjw9v6ehw21x" },
    expiresAt: { type: "string", format: "date-time" },
    user: authUserDataSchema,
  },
};

const signupVerifyDataSchema: OpenApiRecord = {
  type: "object",
  required: ["user", "session", "accessToken", "refreshToken"],
  properties: {
    accessToken: {
      type: "string",
      description:
        "Opaque bearer token for protected APIs. Also set as an HttpOnly cookie for browser clients.",
    },
    user: authUserDataSchema,
    session: authSessionDataSchema,
    sessionToken: {
      type: "string",
      deprecated: true,
      description:
        "Legacy alias for accessToken. New clients should use accessToken.",
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
  required: ["currentSessionId", "sessions", "user"],
  properties: {
    currentSessionId: { type: "string" },
    user: authUserDataSchema,
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
  parameters?: OpenApiRecord[];
  requestSchema?: OpenApiRecord;
  requestBodyRequired?: boolean;
  requiresAuth?: boolean;
  responseSchema: OpenApiRecord;
  successCode: string;
  successDescription?: string;
  successMessage: string;
  successStatus?: number;
  summary: string;
  tag?: string;
}): OpenApiRecord {
  const method = input.method ?? "post";
  const successStatus = input.successStatus ?? HTTP_STATUS.CREATED;

  return {
    [method]: {
      tags: [input.tag ?? "Auth"],
      summary: input.summary,
      description: input.description,
      ...(input.requiresAuth ? { security: [{ bearerAuth: [] }] } : {}),
      ...(input.parameters ? { parameters: input.parameters } : {}),
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
        title: "Nikharta Roop API",
        version: "1.0.0",
        description:
          "Mobile-first API for Nikharta Roop. Endpoints are grouped by flow: Auth first, then User, then future modules.",
      },
      tags: [
        {
          name: "Auth",
          description: "OTP signup/login, sessions, refresh, logout.",
        },
        {
          name: "User",
          description: "Current user profile, avatar, addresses, and history.",
        },
        {
          name: "Branches",
          description: "Public branch discovery and branch selection.",
        },
      ],
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
            "Rotate the refresh token and issue a fresh access token. Browser clients can rely on the HttpOnly refresh cookie; API clients can send refreshToken in the JSON body.",
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
        "/api/v1/users/me/profile": {
          ...jsonEndpoint({
            method: "get",
            tag: "User",
            summary: "Get profile",
            description:
              "Return profile-safe fields for the current authenticated user.",
            failureDescription: "Profile load failed.",
            requiresAuth: true,
            responseSchema: {
              type: "object",
              required: ["user"],
              properties: {
                user: profileUserDataSchema,
              },
            },
            successCode: USER_CODES.PROFILE_LOADED,
            successDescription: "Profile loaded.",
            successMessage: USER_MESSAGES.PROFILE_LOADED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "patch",
            tag: "User",
            summary: "Update profile",
            description:
              "Update one or more editable profile fields for the current authenticated user. Omitted fields stay unchanged. This endpoint does not change mobile number, role, or auth tokens.",
            failureDescription: "Profile update failed.",
            requiresAuth: true,
            requestSchema: {
              type: "object",
              additionalProperties: false,
              minProperties: 1,
              properties: {
                name: {
                  type: "string",
                  nullable: true,
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
                avatarUrl: {
                  type: "string",
                  nullable: true,
                  format: "uri",
                  example: "https://res.cloudinary.com/demo/image/upload/avatar.jpg",
                },
                branchId: {
                  type: "string",
                  nullable: true,
                  example: "cmokbranch0001",
                },
                notificationPreferences: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    bookingReminders: { type: "boolean" },
                    email: { type: "boolean" },
                    offers: { type: "boolean" },
                    push: { type: "boolean" },
                    sms: { type: "boolean" },
                    whatsapp: { type: "boolean" },
                  },
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
        "/api/v1/users/me/avatar": {
          ...jsonEndpoint({
            method: "post",
            tag: "User",
            summary: "Update avatar",
            description:
              "Save the current user's Cloudinary/S3 avatar URL after the image has been uploaded to external storage.",
            failureDescription: "Avatar update failed.",
            requiresAuth: true,
            requestSchema: {
              type: "object",
              additionalProperties: false,
              required: ["avatarUrl"],
              properties: {
                avatarUrl: {
                  type: "string",
                  format: "uri",
                  maxLength: 2048,
                  pattern: "^https://",
                  example:
                    "https://res.cloudinary.com/demo/image/upload/v1/users/avatar.jpg",
                },
              },
            },
            responseSchema: avatarDataSchema,
            successCode: USER_CODES.AVATAR_UPDATED,
            successDescription: "Avatar updated.",
            successMessage: USER_MESSAGES.AVATAR_UPDATED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "delete",
            tag: "User",
            summary: "Remove avatar",
            description: "Clear the current user's saved avatar URL.",
            failureDescription: "Avatar removal failed.",
            requiresAuth: true,
            responseSchema: avatarDataSchema,
            successCode: USER_CODES.AVATAR_REMOVED,
            successDescription: "Avatar removed.",
            successMessage: USER_MESSAGES.AVATAR_REMOVED,
            successStatus: HTTP_STATUS.OK,
          }),
        },
        "/api/v1/users/me/addresses": {
          ...jsonEndpoint({
            method: "get",
            tag: "User",
            summary: "List addresses",
            description: "List saved addresses owned by the current user.",
            failureDescription: "Address load failed.",
            requiresAuth: true,
            responseSchema: {
              type: "object",
              required: ["addresses"],
              properties: {
                addresses: {
                  type: "array",
                  items: addressDataSchema,
                },
              },
            },
            successCode: USER_CODES.ADDRESS_LISTED,
            successDescription: "Addresses loaded.",
            successMessage: USER_MESSAGES.ADDRESS_LISTED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "post",
            tag: "User",
            summary: "Create address",
            description:
              "Create a saved address for the current user. The first address becomes default automatically unless isDefault is provided.",
            failureDescription: "Address creation failed.",
            requiresAuth: true,
            requestSchema: addressRequestSchema,
            responseSchema: {
              type: "object",
              required: ["address"],
              properties: {
                address: addressDataSchema,
              },
            },
            successCode: USER_CODES.ADDRESS_CREATED,
            successDescription: "Address created.",
            successMessage: USER_MESSAGES.ADDRESS_CREATED,
          }),
        },
        "/api/v1/users/me/addresses/{addressId}": {
          ...jsonEndpoint({
            method: "patch",
            tag: "User",
            summary: "Update address",
            description: "Update one saved address owned by the current user.",
            failureDescription: "Address update failed.",
            requiresAuth: true,
            parameters: [
              {
                name: "addressId",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            requestSchema: addressPatchRequestSchema,
            responseSchema: {
              type: "object",
              required: ["address"],
              properties: {
                address: addressDataSchema,
              },
            },
            successCode: USER_CODES.ADDRESS_UPDATED,
            successDescription: "Address updated.",
            successMessage: USER_MESSAGES.ADDRESS_UPDATED,
            successStatus: HTTP_STATUS.OK,
          }),
          ...jsonEndpoint({
            method: "delete",
            tag: "User",
            summary: "Delete address",
            description: "Delete one saved address owned by the current user.",
            failureDescription: "Address deletion failed.",
            requiresAuth: true,
            parameters: [
              {
                name: "addressId",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            responseSchema: {
              type: "object",
              required: ["addressId"],
              properties: {
                addressId: { type: "string", example: "cmokaddress0001" },
              },
            },
            successCode: USER_CODES.ADDRESS_DELETED,
            successDescription: "Address deleted.",
            successMessage: USER_MESSAGES.ADDRESS_DELETED,
            successStatus: HTTP_STATUS.OK,
          }),
        },
        "/api/v1/users/me/bookings": jsonEndpoint({
          method: "get",
          tag: "User",
          summary: "Booking history",
          description:
            "List recent bookings owned by the current user. Supports status and limit query filters.",
          failureDescription: "Booking history load failed.",
          requiresAuth: true,
          parameters: [
            {
              name: "status",
              in: "query",
              required: false,
              schema: {
                type: "string",
                enum: [
                  "PENDING",
                  "CONFIRMED",
                  "IN_PROGRESS",
                  "COMPLETED",
                  "CANCELLED",
                  "NO_SHOW",
                ],
              },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 50,
                default: 20,
              },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["bookings", "limit"],
            properties: {
              bookings: {
                type: "array",
                items: bookingHistoryItemSchema,
              },
              limit: { type: "integer", example: 20 },
            },
          },
          successCode: USER_CODES.BOOKING_HISTORY_LOADED,
          successDescription: "Booking history loaded.",
          successMessage: USER_MESSAGES.BOOKING_HISTORY_LOADED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/branches": jsonEndpoint({
          method: "get",
          tag: "Branches",
          summary: "List branches",
          description:
            "List active branches for public discovery. Supports an optional city filter.",
          failureDescription: "Branch list load failed.",
          parameters: [
            {
              name: "city",
              in: "query",
              required: false,
              schema: {
                type: "string",
                example: "Jaipur",
              },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["branches"],
            properties: {
              branches: {
                type: "array",
                items: branchDataSchema,
              },
            },
          },
          successCode: BRANCH_CODES.BRANCHES_LISTED,
          successDescription: "Branches loaded.",
          successMessage: BRANCH_MESSAGES.BRANCHES_LISTED,
          successStatus: HTTP_STATUS.OK,
        }),
        "/api/v1/branches/{branchId}": jsonEndpoint({
          method: "get",
          tag: "Branches",
          summary: "Get branch",
          description: "Load one active branch by id.",
          failureDescription: "Branch load failed.",
          parameters: [
            {
              name: "branchId",
              in: "path",
              required: true,
              schema: {
                type: "string",
                example: "cmokbranch0001",
              },
            },
          ],
          responseSchema: {
            type: "object",
            required: ["branch"],
            properties: {
              branch: branchDataSchema,
            },
          },
          successCode: BRANCH_CODES.BRANCH_LOADED,
          successDescription: "Branch loaded.",
          successMessage: BRANCH_MESSAGES.BRANCH_LOADED,
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
