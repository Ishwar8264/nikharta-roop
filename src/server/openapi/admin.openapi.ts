import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

const authenticatedRead: OpenAPIV3.SecurityRequirementObject[] = [
  { bearerAuth: [] },
  { accessCookie: [] },
];

const authenticatedMutation: OpenAPIV3.SecurityRequirementObject[] = [
  { bearerAuth: [] },
  { accessCookie: [], csrfToken: [] },
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

/** OpenAPI paths exposed by the admin module. */
export const adminPaths = {
  "/api/v1/admin/users": {
    get: {
      tags: ["Admin"],
      summary: "List platform users",
      description:
        "Cursor-paginated user list for the admin dashboard. Includes the " +
        "AI usage row inline so blocked state and quota meters can be " +
        "rendered without a second request. SUPER_ADMIN only.",
      operationId: "adminListUsers",
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
          name: "search",
          in: "query",
          schema: { type: "string", minLength: 2, maxLength: 120 },
          description: "Case-insensitive match on email or name.",
        },
        {
          name: "role",
          in: "query",
          schema: { type: "string", enum: ["SUPER_ADMIN", "USER"] },
        },
        {
          name: "includeDeleted",
          in: "query",
          schema: { type: "string", enum: ["true", "false"] },
          description: "Include soft-deleted accounts (off by default).",
        },
      ],
      responses: {
        "200": {
          description: "Paginated user list",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminUserListResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN role"),
      },
    },
  },
  "/api/v1/admin/users/{userId}/role": {
    patch: {
      tags: ["Admin"],
      summary: "Change a user's platform role",
      description:
        "Requires SUPER_ADMIN. Guards: no self-demotion, and the platform " +
        "must retain at least one active SUPER_ADMIN. The check and the " +
        "write run in one transaction so concurrent demotions cannot both " +
        "pass.",
      operationId: "adminChangeUserRole",
      security: authenticatedMutation,
      parameters: [idParameter("userId")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AdminUpdateRoleRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Role updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminUserResponse" },
            },
          },
        },
        "400": errorResponse("Validation failure or self-demotion attempt"),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN role"),
        "404": errorResponse("User not found"),
        "409": errorResponse("Last SUPER_ADMIN cannot be demoted"),
      },
    },
  },
  "/api/v1/admin/users/{userId}/ai-block": {
    patch: {
      tags: ["Admin"],
      summary: "Block or unblock AI access for a user",
      description:
        "Sets the `isBlocked` flag on the user's AI usage row. The change " +
        "takes effect on the user's next streaming request. `reason` is " +
        "required when blocking; it is cleared when unblocking.",
      operationId: "adminSetAiBlock",
      security: authenticatedMutation,
      parameters: [idParameter("userId")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AdminAiBlockRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "AI access state updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminUserResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN role"),
        "404": errorResponse("User not found"),
      },
    },
  },
  "/api/v1/admin/users/{userId}/ai-quota": {
    patch: {
      tags: ["Admin"],
      summary: "Adjust a user's AI quota limits",
      description:
        "Any subset of the three limits may be supplied. A limit below the " +
        "amount already used in that window is rejected with 409 so the " +
        "user is not left in a permanently-exhausted state.",
      operationId: "adminSetAiQuota",
      security: authenticatedMutation,
      parameters: [idParameter("userId")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AdminAiQuotaRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Quota updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminUserResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN role"),
        "404": errorResponse("User not found"),
        "409": errorResponse(
          "New limit is below the amount already used in this window",
        ),
      },
    },
  },
  "/api/v1/admin/ai-usage": {
    get: {
      tags: ["Admin"],
      summary: "List AI usage log rows",
      description:
        "Raw per-request rows for the cost dashboard. Ordered newest first. " +
        "SUPER_ADMIN only.",
      operationId: "adminListAiUsage",
      security: authenticatedRead,
      parameters: [
        { $ref: "#/components/parameters/CursorParam" },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
        },
        {
          name: "userId",
          in: "query",
          schema: { $ref: "#/components/schemas/ResourceId" },
        },
        {
          name: "model",
          in: "query",
          schema: { type: "string", maxLength: 64 },
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
          description: "Paginated AI usage rows",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AdminAiUsageListResponse",
              },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN role"),
      },
    },
  },
  "/api/v1/admin/ai-usage/stats": {
    get: {
      tags: ["Admin"],
      summary: "Aggregated AI usage stats",
      description:
        "Returns per-model, per-day, or per-user aggregates for the admin " +
        "dashboard. All three run in the database.",
      operationId: "adminAiUsageStats",
      security: authenticatedRead,
      parameters: [
        {
          name: "groupBy",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["model", "day", "user"],
            default: "model",
          },
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
          description: "Aggregated stats",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminAiStatsResponse" },
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

/** Reusable OpenAPI schemas exposed by the admin module. */
export const adminSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  AdminAiUsageSummary: {
    type: "object",
    required: [
      "isBlocked",
      "blockReason",
      "dailyUsed",
      "dailyLimit",
      "weeklyUsed",
      "weeklyLimit",
      "monthlyUsed",
      "monthlyLimit",
    ],
    properties: {
      isBlocked: { type: "boolean" },
      blockReason: { type: ["string", "null"] },
      dailyUsed: { type: "integer", minimum: 0 },
      dailyLimit: { type: "integer", minimum: 0 },
      weeklyUsed: { type: "integer", minimum: 0 },
      weeklyLimit: { type: "integer", minimum: 0 },
      monthlyUsed: { type: "integer", minimum: 0 },
      monthlyLimit: { type: "integer", minimum: 0 },
    },
  },
  AdminUser: {
    type: "object",
    required: [
      "id",
      "email",
      "phone",
      "name",
      "avatar",
      "role",
      "emailVerified",
      "phoneVerified",
      "loyaltyPoints",
      "isOnboarded",
      "deletedAt",
      "createdAt",
      "aiUsage",
    ],
    properties: {
      id: { $ref: "#/components/schemas/ResourceId" },
      email: { type: ["string", "null"], format: "email" },
      phone: { type: ["string", "null"] },
      name: { type: ["string", "null"] },
      avatar: { type: ["string", "null"], format: "uri" },
      role: { type: "string", enum: ["SUPER_ADMIN", "USER"] },
      emailVerified: { type: "boolean" },
      phoneVerified: { type: "boolean" },
      loyaltyPoints: { type: "integer", minimum: 0 },
      isOnboarded: { type: "boolean" },
      deletedAt: { type: ["string", "null"], format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      aiUsage: {
        oneOf: [
          { $ref: "#/components/schemas/AdminAiUsageSummary" },
          { type: "null" },
        ],
      },
    },
  },
  AdminUpdateRoleRequest: {
    type: "object",
    additionalProperties: false,
    required: ["role"],
    properties: {
      role: { type: "string", enum: ["SUPER_ADMIN", "USER"] },
    },
  },
  AdminAiBlockRequest: {
    type: "object",
    additionalProperties: false,
    required: ["isBlocked"],
    properties: {
      isBlocked: { type: "boolean" },
      reason: { type: "string", minLength: 3, maxLength: 500 },
    },
  },
  AdminAiQuotaRequest: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: {
      dailyLimit: { type: "integer", minimum: 0, maximum: 10000000 },
      weeklyLimit: { type: "integer", minimum: 0, maximum: 100000000 },
      monthlyLimit: { type: "integer", minimum: 0, maximum: 1000000000 },
    },
  },
  AdminUserResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["user"],
        properties: {
          user: { $ref: "#/components/schemas/AdminUser" },
        },
      },
    },
  },
  AdminUserListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/AdminUser" },
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
  AdminAiUsageLog: {
    type: "object",
    required: [
      "id",
      "userId",
      "chatId",
      "inputTokens",
      "outputTokens",
      "totalTokens",
      "model",
      "costUsd",
      "contextType",
      "createdAt",
    ],
    properties: {
      id: { $ref: "#/components/schemas/ResourceId" },
      userId: { $ref: "#/components/schemas/ResourceId" },
      chatId: {
        oneOf: [{ $ref: "#/components/schemas/ResourceId" }, { type: "null" }],
      },
      inputTokens: { type: "integer", minimum: 0 },
      outputTokens: { type: "integer", minimum: 0 },
      totalTokens: { type: "integer", minimum: 0 },
      model: { type: "string" },
      costUsd: { type: ["number", "null"] },
      contextType: {
        type: "string",
        enum: ["GENERAL", "STAFF", "PRODUCT", "SERVICE"],
      },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  AdminAiUsageListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/AdminAiUsageLog" },
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
  AdminAiStatRow: {
    type: "object",
    required: [
      "key",
      "totalTokens",
      "inputTokens",
      "outputTokens",
      "totalCostUsd",
      "requestCount",
    ],
    properties: {
      key: { type: "string" },
      totalTokens: { type: "integer", minimum: 0 },
      inputTokens: { type: "integer", minimum: 0 },
      outputTokens: { type: "integer", minimum: 0 },
      totalCostUsd: { type: "number", minimum: 0 },
      requestCount: { type: "integer", minimum: 0 },
    },
  },
  AdminAiStatsResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["groupBy", "rows"],
        properties: {
          groupBy: { type: "string", enum: ["model", "day", "user"] },
          rows: {
            type: "array",
            items: { $ref: "#/components/schemas/AdminAiStatRow" },
          },
        },
      },
    },
  },
};
