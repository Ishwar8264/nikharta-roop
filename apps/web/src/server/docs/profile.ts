import { API_BASE_PATH } from "@nikharta-roop/shared";
import { errorResponse } from "./common";

export const profilePaths = {
  [`${API_BASE_PATH}/profiles`]: {
    post: {
      operationId: "createProfile",
      tags: ["Profiles"],
      summary: "Create your personal profile",
      description:
        "Requires an active, verified session and a trusted Origin header. Creates one user public profile per account with initial DRAFT status. Ownership and lifecycle fields cannot be supplied. Duplicate profiles or slugs return 409. Responses are private and uncached.",
      security: [{ apiKeyCookie: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateProfileInput" },
          },
        },
      },
      responses: {
        "201": {
          description: "Personal profile created.",
          headers: {
            "Cache-Control": { schema: { type: "string", example: "private, no-store" } },
          },
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateProfileResponse" },
            },
          },
        },
        "400": errorResponse("Invalid JSON, fields, or validation errors."),
        "401": errorResponse("No active, verified session."),
        "403": errorResponse("Missing or untrusted Origin header."),
        "409": errorResponse("This account already has a personal profile, or the slug is taken."),
        "415": errorResponse("Content-Type must be application/json."),
        "429": errorResponse("Rate limit exhausted."),
        "503": errorResponse("Redis rate limiting is unavailable."),
        "500": errorResponse("An unexpected infrastructure error occurred."),
      },
    },
  },
};

export const profileSchemas = {
  CreateProfileInput: {
    type: "object",
    additionalProperties: false,
    required: ["displayName", "slug"],
    properties: {
      displayName: { type: "string", minLength: 2, maxLength: 100 },
      slug: {
        type: "string",
        minLength: 3,
        maxLength: 120,
        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        description: "Trimmed and normalized to lowercase before validation.",
      },
      bio: { type: ["string", "null"], maxLength: 500 },
      avatar: {
        type: ["string", "null"],
        format: "uri",
        maxLength: 2048,
        description: "HTTP or HTTPS URL only.",
      },
    },
  },
  CreateProfileResponse: {
    type: "object",
    required: ["ok", "data"],
    properties: {
      ok: { type: "boolean", enum: [true] },
      message: { type: "string" },
      data: {
        type: "object",
        required: ["profile"],
        properties: {
          profile: {
            type: "object",
            required: ["id", "status", "slug", "displayName", "bio", "avatar"],
            properties: {
              id: { type: "string" },
              status: { type: "string", enum: ["DRAFT"] },
              slug: { type: "string" },
              displayName: { type: "string" },
              bio: { type: ["string", "null"] },
              avatar: { type: ["string", "null"] },
            },
          },
        },
      },
    },
  },
};
