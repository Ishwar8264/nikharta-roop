import { NextResponse } from "next/server";

import {
  AUTH_CODES,
  AUTH_MESSAGES,
  AUTH_OTP_CONFIG,
} from "@/features/auth/constants/auth.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OpenApiRecord = Record<string, unknown>;

/**
 * Wraps a successful endpoint payload in the shared API response shape.
 */
function successResponse(dataSchema: OpenApiRecord): OpenApiRecord {
  return {
    type: "object",
    required: ["success", "code", "message", "data"],
    properties: {
      success: { type: "boolean", example: true },
      code: { type: "string", example: AUTH_CODES.SIGNUP_OTP_SENT },
      message: {
        type: "string",
        example: AUTH_MESSAGES.SIGNUP_OTP_SENT,
      },
      data: dataSchema,
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

/**
 * Creates an OpenAPI JSON endpoint definition.
 */
function jsonEndpoint(input: {
  description: string;
  requestSchema?: OpenApiRecord;
  responseSchema: OpenApiRecord;
  summary: string;
}): OpenApiRecord {
  return {
    post: {
      tags: ["Auth"],
      summary: input.summary,
      description: input.description,
      ...(input.requestSchema
        ? {
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: input.requestSchema,
                },
              },
            },
          }
        : {}),
      responses: {
        [HTTP_STATUS.CREATED]: {
          description: "OTP challenge created.",
          content: {
            "application/json": {
              schema: successResponse(input.responseSchema),
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
        [HTTP_STATUS.UNPROCESSABLE_ENTITY]: {
          description: "Request validation failed.",
          content: {
            "application/json": {
              schema: errorResponse(),
            },
          },
        },
        [HTTP_STATUS.INTERNAL_SERVER_ERROR]: {
          description: "Registration failed.",
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
