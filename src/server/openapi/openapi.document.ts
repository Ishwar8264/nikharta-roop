import "server-only";

import type { OpenAPIV3_1 } from "openapi-types";

const errorResponseSchema: OpenAPIV3_1.SchemaObject = {
  type: "object",
  required: ["message"],
  properties: {
    message: { type: "string" },
  },
};

/**
 * Builds the public OpenAPI contract consumed by Swagger UI and API clients.
 *
 * Why:
 * Keeping the contract in one server-only module prevents the interactive UI
 * and the machine-readable `/api-docs` response from drifting apart.
 */
export function getOpenApiDocument(): OpenAPIV3_1.Document {
  return {
    openapi: "3.1.0",
    info: {
      title: "Nikharta Roop API",
      version: "1.0.0",
      description:
        "Interactive API documentation for the Nikharta Roop platform.",
    },
    servers: [
      {
        url: "/",
        description: "Current server",
      },
    ],
    tags: [
      { name: "Authentication", description: "User identity operations" },
      { name: "System", description: "Service availability operations" },
    ],
    paths: {
      "/api/v1/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a user",
          description:
            "Creates a local user account. Provide at least one of email or phone.",
          operationId: "registerUser",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RegisterUserRequest",
                },
                examples: {
                  emailRegistration: {
                    summary: "Register with email",
                    value: {
                      name: "Ishwar Kumar",
                      email: "ishwar@example.com",
                      password: "secure-password",
                    },
                  },
                  phoneRegistration: {
                    summary: "Register with phone",
                    value: {
                      name: "Ishwar Kumar",
                      phone: "+919876543210",
                      password: "secure-password",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "User registered successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/RegisterUserResponse",
                  },
                },
              },
            },
            "400": {
              description: "Malformed JSON or validation failure",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "409": {
              description: "Email or phone already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected registration failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Sign in a user",
          description:
            "Authenticates a user with an email or phone plus password. " +
            "Returns the access token in the response body and sets " +
            "`accessToken` and `refreshToken` as httpOnly cookies. " +
            "Use the returned token with the `bearerAuth` scheme for " +
            "protected endpoints.",
          operationId: "loginUser",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LoginUserRequest",
                },
                examples: {
                  emailLogin: {
                    summary: "Sign in with email",
                    value: {
                      email: "ishwar@example.com",
                      password: "secure-password",
                    },
                  },
                  phoneLogin: {
                    summary: "Sign in with phone",
                    value: {
                      phone: "+919876543210",
                      password: "secure-password",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Login successful. Sets `accessToken` and `refreshToken` " +
                "httpOnly cookies and returns the access token in the body.",
              headers: {
                "Set-Cookie": {
                  description:
                    "accessToken and refreshToken cookies (httpOnly, SameSite=Lax).",
                  schema: { type: "string" },
                },
              },
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/LoginUserResponse",
                  },
                },
              },
            },
            "400": {
              description: "Malformed JSON or validation failure",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "401": {
              description: "Invalid email/phone or password",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "403": {
              description:
                "Account exists but email/phone is not verified, or account is deactivated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected sign-in failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/refresh": {
        post: {
          tags: ["Authentication"],
          summary: "Rotate refresh token",
          description:
            "Exchanges the `refreshToken` httpOnly cookie for a new access + " +
            "refresh token pair. The previous refresh token is revoked on every " +
            "successful call. Reuse of a revoked token revokes every session for " +
            "that user, forcing a full re-login.",
          operationId: "refreshTokens",
          security: [],
          responses: {
            "200": {
              description:
                "Token refreshed. Sets new `accessToken` and `refreshToken` " +
                "httpOnly cookies.",
              headers: {
                "Set-Cookie": {
                  description:
                    "New accessToken and refreshToken cookies (httpOnly, SameSite=Lax).",
                  schema: { type: "string" },
                },
              },
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/RefreshTokenResponse",
                  },
                },
              },
            },
            "401": {
              description:
                "Missing, invalid, expired, or already-revoked refresh token. " +
                "Both auth cookies are cleared.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected refresh failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/logout": {
        post: {
          tags: ["Authentication"],
          summary: "Log out the current session",
          description:
            "Revokes the `refreshToken` httpOnly cookie on the server and clears " +
            "both auth cookies. Idempotent: always returns 200, even when no " +
            "session exists. Access tokens are short-lived JWTs and are not " +
            "revoked explicitly — they expire on their own.",
          operationId: "logoutUser",
          security: [],
          responses: {
            "200": {
              description:
                "Logged out. `accessToken` and `refreshToken` cookies are cleared.",
              headers: {
                "Set-Cookie": {
                  description:
                    "accessToken and refreshToken cookies cleared (maxAge: 0).",
                  schema: { type: "string" },
                },
              },
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/LogoutResponse",
                  },
                },
              },
            },
            "500": {
              description: "Unexpected logout failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/health": {
        get: {
          tags: ["System"],
          summary: "Check service health",
          description:
            "Checks whether the API and its PostgreSQL dependency are available.",
          operationId: "getHealthStatus",
          responses: {
            "200": {
              description: "API and database are available",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
            "503": {
              description: "Database is unavailable",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/UnhealthyResponse",
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT access token for protected endpoints",
        },
      },
      schemas: {
        RegisterUserRequest: {
          type: "object",
          additionalProperties: false,
          required: ["name", "password"],
          properties: {
            name: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              example: "Ishwar Kumar",
            },
            email: {
              type: "string",
              format: "email",
              maxLength: 254,
              example: "ishwar@example.com",
            },
            phone: {
              type: "string",
              pattern: "^\\+[1-9]\\d{7,14}$",
              example: "+919876543210",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              maxLength: 128,
              writeOnly: true,
              example: "secure-password",
            },
          },
          anyOf: [{ required: ["email"] }, { required: ["phone"] }],
        },
        LoginUserRequest: {
          type: "object",
          additionalProperties: false,
          required: ["password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              maxLength: 254,
              example: "ishwar@example.com",
            },
            phone: {
              type: "string",
              pattern: "^\\+[1-9]\\d{7,14}$",
              example: "+919876543210",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 1,
              maxLength: 128,
              writeOnly: true,
              example: "secure-password",
            },
          },
          anyOf: [{ required: ["email"] }, { required: ["phone"] }],
        },
        RefreshTokenResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: {
              type: "string",
              const: "Token refreshed",
            },
            data: {
              type: "object",
              required: ["accessToken", "accessTokenExpiresIn"],
              properties: {
                accessToken: {
                  type: "string",
                  description:
                    "New short-lived JWT. Also set as an httpOnly cookie.",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi...",
                },
                accessTokenExpiresIn: {
                  type: "integer",
                  description: "Access token lifetime in seconds.",
                  example: 900,
                },
              },
            },
          },
        },
        LogoutResponse: {
          type: "object",
          required: ["message"],
          properties: {
            message: {
              type: "string",
              const: "Logged out successfully",
            },
          },
        },

        LoginUserResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: {
              type: "string",
              const: "Login successful",
            },
            data: {
              type: "object",
              required: ["user", "accessToken", "accessTokenExpiresIn"],
              properties: {
                user: { $ref: "#/components/schemas/PublicUser" },
                accessToken: {
                  type: "string",
                  description:
                    "Short-lived JWT (HS256). Send as `Authorization: Bearer <token>` " +
                    "for protected endpoints. Also set as an httpOnly cookie.",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi...",
                },
                accessTokenExpiresIn: {
                  type: "integer",
                  description: "Access token lifetime in seconds.",
                  example: 900,
                },
              },
            },
          },
        },
        PublicUser: {
          type: "object",
          required: ["id", "name", "email", "phone", "createdAt"],
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: ["string", "null"] },
            email: { type: ["string", "null"], format: "email" },
            phone: { type: ["string", "null"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        RegisterUserResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: {
              type: "string",
              const: "User registered successfully",
            },
            data: {
              type: "object",
              required: ["user"],
              properties: {
                user: { $ref: "#/components/schemas/PublicUser" },
              },
            },
          },
        },
        ValidationIssue: {
          type: "object",
          required: ["field", "message"],
          properties: {
            field: { type: "string", example: "email" },
            message: { type: "string", example: "Email format is invalid" },
          },
        },
        ValidationErrorResponse: {
          type: "object",
          required: ["message", "errors"],
          properties: {
            message: { type: "string", const: "Validation failed" },
            errors: {
              type: "array",
              items: { $ref: "#/components/schemas/ValidationIssue" },
            },
          },
        },
        ErrorResponse: errorResponseSchema,
        HealthResponse: {
          type: "object",
          required: ["status", "database", "timestamp"],
          properties: {
            status: { type: "string", const: "ok" },
            database: { type: "string", const: "connected" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        UnhealthyResponse: {
          type: "object",
          required: ["status", "database", "timestamp"],
          properties: {
            status: { type: "string", const: "error" },
            database: { type: "string", const: "disconnected" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
      },
    },
  };
}
