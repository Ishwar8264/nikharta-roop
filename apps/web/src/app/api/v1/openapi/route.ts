import { API_BASE_PATH, AUTH_BASE_PATH } from "@nikharta-roop/shared";
import { auth } from "@/server/auth";

export const dynamic = "force-dynamic";

/** Metadata only: calling the server API avoids requiring Redis just to browse documentation. */
export async function GET(): Promise<Response> {
  const document = await auth.api.generateOpenAPISchema();
  const authPaths = Object.fromEntries(
    Object.entries(document.paths).map(([path, operation]) => [
      `${AUTH_BASE_PATH}${path}`,
      operation,
    ]),
  );
  const errorResponse = (description: string, rateLimited = false) => ({
    description,
    ...(rateLimited
      ? {
          headers: {
            "Retry-After": { description: "Seconds before retrying.", schema: { type: "integer" } },
          },
        }
      : {}),
    content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
  });

  return Response.json(
    {
      ...document,
      info: {
        title: "Nikharta Roop API",
        version: "1.0.0",
        description:
          "Versioned auth, account, profile and health APIs. Auth uses native Better Auth responses; other APIs use the shared JSON envelope.",
      },
      servers: [{ url: "/" }],
      paths: {
        ...authPaths,
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
                "application/json": { schema: { $ref: "#/components/schemas/CreateProfileInput" } },
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
              "409": errorResponse(
                "This account already has a personal profile, or the slug is taken.",
              ),
              "415": errorResponse("Content-Type must be application/json."),
              "429": errorResponse("Rate limit exhausted."),
              "503": errorResponse("Redis rate limiting is unavailable."),
              "500": errorResponse("An unexpected infrastructure error occurred."),
            },
          },
        },
        [`${API_BASE_PATH}/me`]: {
          get: {
            operationId: "getMe",
            tags: ["Account"],
            summary: "Get the signed-in account",
            security: [{ apiKeyCookie: [] }],
            description:
              "Requires a valid session and a currently active, verified account. Returns current DB identity fields only. Limited to 10 requests per 10 seconds per client IP. Success and error responses are private and uncached.",
            responses: {
              "200": {
                description: "The signed-in account.",
                headers: {
                  "Cache-Control": { schema: { type: "string", example: "private, no-store" } },
                },
                content: {
                  "application/json": { schema: { $ref: "#/components/schemas/MeResponse" } },
                },
              },
              "401": errorResponse("No valid active, verified session."),
              "429": errorResponse("Rate limit exhausted."),
              "503": errorResponse("Redis rate limiting is unavailable."),
              "500": errorResponse("An unexpected infrastructure error occurred."),
            },
          },
        },
        [`${API_BASE_PATH}/health`]: {
          get: {
            operationId: "getHealth",
            tags: ["Health"],
            summary: "Check PostgreSQL and Redis readiness",
            description:
              "Public, uncached endpoint. Limited to 10 requests per 10 seconds per client IP. Dependency checks have a two-second response budget.",
            security: [],
            responses: {
              "200": {
                description: "PostgreSQL and Redis are healthy.",
                headers: {
                  "Cache-Control": { schema: { type: "string", example: "no-store" } },
                  "X-RateLimit-Limit": { schema: { type: "integer", example: 10 } },
                  "X-RateLimit-Remaining": { schema: { type: "integer" } },
                  "X-RateLimit-Reset": {
                    schema: {
                      type: "integer",
                      description: "Reset time in milliseconds since the Unix epoch.",
                    },
                  },
                },
                content: {
                  "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } },
                },
              },
              "429": errorResponse("Rate limit exhausted.", true),
              "503": errorResponse("PostgreSQL, Redis, or the rate limiter is unavailable."),
            },
          },
        },
      },
      components: {
        ...document.components,
        schemas: {
          ...document.components?.schemas,
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
          MeResponse: {
            type: "object",
            required: ["ok", "data"],
            properties: {
              ok: { type: "boolean", enum: [true] },
              data: {
                type: "object",
                required: ["user"],
                properties: {
                  user: {
                    type: "object",
                    required: ["id", "name", "email", "emailVerified", "image", "role"],
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      email: { type: ["string", "null"], format: "email" },
                      emailVerified: { type: "boolean" },
                      image: { type: ["string", "null"] },
                      role: {
                        type: "string",
                        description: "Current platform role, read from the database.",
                      },
                    },
                  },
                },
              },
            },
          },
          ApiError: {
            type: "object",
            required: ["ok", "error"],
            properties: {
              ok: { type: "boolean", enum: [false] },
              error: {
                type: "object",
                required: ["code", "message"],
                properties: { code: { type: "string" }, message: { type: "string" }, details: {} },
              },
            },
          },
          HealthResponse: {
            type: "object",
            required: ["ok", "data"],
            properties: {
              ok: { type: "boolean", enum: [true] },
              data: {
                type: "object",
                required: ["status", "checks"],
                properties: {
                  status: { type: "string", enum: ["ok"] },
                  checks: {
                    type: "object",
                    required: ["database", "redis"],
                    properties: {
                      database: { type: "string", enum: ["up"] },
                      redis: { type: "string", enum: ["up"] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
