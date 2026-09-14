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
