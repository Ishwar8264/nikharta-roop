import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

const authenticatedRead: OpenAPIV3.SecurityRequirementObject[] = [
  { bearerAuth: [] },
  { accessCookie: [] },
];

const validationResponse: OpenAPIV3.ResponseObject = {
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
};

function errorResponse(description: string): OpenAPIV3.ResponseObject {
  return {
    description,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  };
}

function idParameter(name: string): OpenAPIV3.ParameterObject {
  return {
    name,
    in: "path",
    required: true,
    schema: { $ref: "#/components/schemas/ResourceId" },
  };
}

/** OpenAPI paths exposed by the audit module. */
export const auditPaths = {
  "/api/v1/audit-logs": {
    get: {
      tags: ["Audit"],
      summary: "List audit log entries",
      description:
        "Cursor-paginated audit trail. Newest first. SUPER_ADMIN only. " +
        "Filters compose with AND semantics.",
      operationId: "listAuditLogs",
      security: authenticatedRead,
      parameters: [
        { $ref: "#/components/parameters/CursorParam" },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
        },
        {
          name: "entity",
          in: "query",
          schema: { type: "string", maxLength: 64 },
          description: 'Entity name — "Salon", "Appointment", "BlogPost", etc.',
        },
        {
          name: "entityId",
          in: "query",
          schema: { $ref: "#/components/schemas/ResourceId" },
        },
        {
          name: "userId",
          in: "query",
          schema: { $ref: "#/components/schemas/ResourceId" },
        },
        {
          name: "action",
          in: "query",
          schema: { type: "string", enum: ["CREATE", "UPDATE", "DELETE"] },
        },
        {
          name: "from",
          in: "query",
          schema: { type: "string", format: "date-time" },
        },
        {
          name: "to",
          in: "query",
          schema: { type: "string", format: "date-time" },
        },
      ],
      responses: {
        "200": {
          description: "Paginated audit entries",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuditLogListResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN role"),
      },
    },
  },
  "/api/v1/audit-logs/{logId}": {
    get: {
      tags: ["Audit"],
      summary: "Get a single audit log entry",
      operationId: "getAuditLog",
      security: authenticatedRead,
      parameters: [idParameter("logId")],
      responses: {
        "200": {
          description: "Audit entry",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuditLogResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN role"),
        "404": errorResponse("Audit entry not found"),
      },
    },
  },
  "/api/v1/audit-logs/entity/{entity}/{entityId}": {
    get: {
      tags: ["Audit"],
      summary: "Get the change history of one entity",
      description:
        "Returns every audit entry that targeted the given entity, newest " +
        "first. Same authorization and paging rules as the list endpoint.",
      operationId: "getAuditEntityHistory",
      security: authenticatedRead,
      parameters: [
        {
          name: "entity",
          in: "path",
          required: true,
          schema: { type: "string", maxLength: 64 },
        },
        idParameter("entityId"),
        { $ref: "#/components/parameters/CursorParam" },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
        },
      ],
      responses: {
        "200": {
          description: "Paginated entity history",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuditLogListResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN role"),
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

/** Reusable OpenAPI schemas exposed by the audit module. */
export const auditSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  AuditLog: {
    type: "object",
    required: [
      "id",
      "userId",
      "action",
      "entity",
      "entityId",
      "oldData",
      "newData",
      "ipAddress",
      "userAgent",
      "createdAt",
    ],
    properties: {
      id: { $ref: "#/components/schemas/ResourceId" },
      userId: {
        oneOf: [{ $ref: "#/components/schemas/ResourceId" }, { type: "null" }],
        description: "Actor user id, or null for system-driven events.",
      },
      action: {
        type: "string",
        enum: ["CREATE", "UPDATE", "DELETE"],
      },
      entity: { type: "string", example: "Salon" },
      entityId: {
        oneOf: [{ $ref: "#/components/schemas/ResourceId" }, { type: "null" }],
      },
      oldData: {
        oneOf: [
          { type: "object", additionalProperties: true },
          { type: "null" },
        ],
      },
      newData: {
        oneOf: [
          { type: "object", additionalProperties: true },
          { type: "null" },
        ],
      },
      ipAddress: { type: ["string", "null"] },
      userAgent: { type: ["string", "null"] },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  AuditLogResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["log"],
        properties: {
          log: { $ref: "#/components/schemas/AuditLog" },
        },
      },
    },
  },
  AuditLogListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/AuditLog" },
      },
      meta: {
        type: "object",
        required: ["nextCursor", "hasMore"],
        properties: {
          nextCursor: {
            oneOf: [
              { $ref: "#/components/schemas/ResourceId" },
              { type: "null" },
            ],
          },
          hasMore: { type: "boolean" },
        },
      },
    },
  },
};
