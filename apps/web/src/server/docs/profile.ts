import { API_BASE_PATH } from "@nikharta-roop/shared";
import { errorResponse } from "./common";

const profileResponse = {
  description: "Your personal profile. Responses are private and uncached.",
  headers: { "Cache-Control": { schema: { type: "string", example: "private, no-store" } } },
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/ProfileResponse" } },
  },
};

const profileErrors = {
  "401": errorResponse("No active, verified session."),
  "404": errorResponse("Your profile was not found."),
  "429": errorResponse("Rate limit exhausted."),
  "503": errorResponse("Redis rate limiting is unavailable."),
  "500": errorResponse("An unexpected infrastructure error occurred."),
};

export const profilePaths = {
  [`${API_BASE_PATH}/profiles`]: {
    get: {
      operationId: "listProfiles",
      tags: ["Profiles"],
      summary: "List profiles",
      description: "Requires an active, verified session. ADMIN can list all profiles and filter any status. Other roles see only ACTIVE profiles belonging to active, verified accounts. Pages start at 0; size defaults to 20 and is limited to 100. Maximum page × size is 10000. Unknown and repeated filters are rejected. Empty results return 200 with an empty items array.",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
        { name: "size", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
        { name: "search", in: "query", description: "Case-insensitive literal search over display name and slug.", schema: { type: "string", maxLength: 100 } },
        { name: "slug", in: "query", description: "Exact profile slug; trimmed and normalized to lowercase.", schema: { type: "string", minLength: 3, maxLength: 120 } },
        { name: "status", in: "query", description: "Only ADMIN may request non-active profiles.", schema: { type: "string", enum: ["DRAFT", "ACTIVE", "SUSPENDED", "ARCHIVED"] } },
        { name: "sortBy", in: "query", schema: { type: "string", enum: ["createdAt", "displayName", "slug"], default: "createdAt" } },
        { name: "sortDir", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
      ],
      security: [{ apiKeyCookie: [] }],
      responses: {
        "200": {
          description: "Profiles retrieved successfully, or no profiles match the filters.",
          headers: profileResponse.headers,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ListProfilesResponse" } } },
        },
        "400": errorResponse("Invalid, unknown, or repeated filters, or pagination depth exceeded."),
        "401": profileErrors["401"],
        "403": errorResponse("Only administrators can filter non-active profiles."),
        "429": profileErrors["429"],
        "503": profileErrors["503"],
        "500": profileErrors["500"],
      },
    },
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
  [`${API_BASE_PATH}/profiles/{slug}`]: {
    delete: {
      operationId: "deleteProfile",
      tags: ["Profiles"],
      summary: "Delete a profile (admin only)",
      description: "Permanently removes only the profile record. Requires an active, verified ADMIN account and a trusted Origin header. USER and CONTENT_ADMIN accounts cannot delete profiles. User account and salon records remain. No request body is required.",
      security: [{ apiKeyCookie: [] }],
      parameters: [{
        name: "slug",
        in: "path",
        required: true,
        schema: { type: "string", minLength: 3, maxLength: 120, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
      }],
      responses: {
        "204": {
          description: "Profile deleted. No response body.",
          headers: { "Cache-Control": { schema: { type: "string", example: "private, no-store" } } },
        },
        "400": errorResponse("Invalid profile slug."),
        "403": errorResponse("ADMIN role required, or missing or untrusted Origin header."),
        ...profileErrors,
      },
    },
    patch: {
      operationId: "updateProfile",
      parameters: [{
        name: "slug",
        in: "path",
        required: true,
        schema: { type: "string", minLength: 3, maxLength: 120, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
        description: "Current profile slug. Only the signed-in owner can update this profile.",
      }],
      tags: ["Profiles"],
      summary: "Update your personal profile",
      description: "Requires an active, verified session and a trusted Origin header. Supply at least one display field. Omitted fields are preserved; null clears bio or avatar. Ownership and lifecycle status cannot be changed.",
      security: [{ apiKeyCookie: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/UpdateProfileInput" } },
        },
      },
      responses: {
        "200": profileResponse,
        "400": errorResponse("Invalid JSON, empty update, unknown fields, or validation errors."),
        "403": errorResponse("Missing or untrusted Origin header."),
        "409": errorResponse("The slug is already taken."),
        "415": errorResponse("Content-Type must be application/json."),
        ...profileErrors,
      },
    },
  },
};

const baseProfileSchemas = {
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
              status: { type: "string", enum: ["DRAFT", "ACTIVE", "SUSPENDED", "ARCHIVED"] },
              slug: { type: "string" },
              displayName: { type: ["string", "null"] },
              bio: { type: ["string", "null"] },
              avatar: { type: ["string", "null"] },
            },
          },
        },
      },
    },
  },
};

export const profileSchemas = {
  ListProfilesResponse: {
    type: "object",
    required: ["ok", "data", "message"],
    properties: {
      ok: { type: "boolean", enum: [true] },
      message: { type: "string", example: "Profiles retrieved successfully." },
      data: {
        type: "object",
        required: ["items", "page", "size", "totalElements", "totalPages"],
        properties: {
          items: { type: "array", items: baseProfileSchemas.CreateProfileResponse.properties.data.properties.profile },
          page: { type: "integer", minimum: 0 },
          size: { type: "integer", minimum: 1, maximum: 100 },
          totalElements: { type: "integer", minimum: 0 },
          totalPages: { type: "integer", minimum: 0 },
        },
      },
    },
  },
  ...baseProfileSchemas,
  UpdateProfileInput: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: baseProfileSchemas.CreateProfileInput.properties,
  },
  ProfileResponse: baseProfileSchemas.CreateProfileResponse,
};
