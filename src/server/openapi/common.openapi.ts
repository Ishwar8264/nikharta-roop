import type { OpenAPIV3_1 } from "openapi-types";

/** Shared error schema used across every module. */
const errorResponseSchema: OpenAPIV3_1.SchemaObject = {
  type: "object",
  required: ["message"],
  properties: {
    message: { type: "string" },
  },
};

/** Security schemes: bearer token, httpOnly cookie, CSRF header. */
export const commonSecuritySchemes: Record<
  string,
  OpenAPIV3_1.SecuritySchemeObject
> = {
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "JWT access token for protected endpoints",
  },
  accessCookie: {
    type: "apiKey",
    in: "cookie",
    name: "accessToken",
    description:
      "HttpOnly JWT cookie set by login, refresh, and password change.",
  },
  csrfToken: {
    type: "apiKey",
    in: "header",
    name: "x-csrf-token",
    description:
      "Required for cookie-authenticated mutations. Copy the value from the readable csrfToken cookie. Bearer-only clients are exempt.",
  },
};

/** Reusable responses. */
export const commonResponses: Record<string, OpenAPIV3_1.ResponseObject> = {
  Unauthorized: {
    description: "Authentication required",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  },
  Forbidden: {
    description: "Insufficient permission",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  },
};

/** Reusable parameters. */
export const commonParameters: Record<string, OpenAPIV3_1.ParameterObject> = {
  CursorParam: {
    name: "cursor",
    in: "query",
    required: false,
    description:
      "Opaque cursor returned by the previous page (`meta.nextCursor`).",
    schema: { $ref: "#/components/schemas/ResourceId" },
  },
  LimitParam: {
    name: "limit",
    in: "query",
    required: false,
    description: "Page size. Defaults to 20, max 50.",
    schema: {
      type: "integer",
      minimum: 1,
      maximum: 50,
      default: 20,
    },
  },
};

/** Shared schemas: ids, errors, validation shape. */
export const commonSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  ResourceId: {
    description:
      "A 48-character secure ID. UUID is also accepted for records created before the ID migration.",
    oneOf: [
      {
        type: "string",
        pattern: "^[a-f0-9]{48}$",
        example: "3fe48374dc93727a7c57bd53796fe078dc46b76b6f21fffb",
      },
      { type: "string", format: "uuid" },
    ],
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
};
