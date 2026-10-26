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

export const notificationPaths = {
  "/api/v1/notifications": {
    get: {
      tags: ["Notifications"],
      summary: "List the caller's notifications",
      operationId: "listNotifications",
      security: authenticatedRead,
      parameters: [
        { $ref: "#/components/parameters/CursorParam" },
        { $ref: "#/components/parameters/LimitParam" },
        {
          name: "channel",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["EMAIL", "SMS", "WHATSAPP", "PUSH", "IN_APP"],
          },
        },
        {
          name: "unreadOnly",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["true", "false"] },
        },
      ],
      responses: {
        "200": {
          description: "Paginated notification inbox",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NotificationListResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/v1/notifications/unread-count": {
    get: {
      tags: ["Notifications"],
      summary: "Get the caller's unread notification count",
      operationId: "getUnreadNotificationCount",
      security: authenticatedRead,
      responses: {
        "200": {
          description: "Unread count",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UnreadCountResponse",
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/v1/notifications/{notificationId}": {
    patch: {
      tags: ["Notifications"],
      summary: "Mark a notification as read",
      operationId: "markNotificationRead",
      security: authenticatedMutation,
      parameters: [idParameter("notificationId")],
      responses: {
        "200": {
          description: "Notification marked read",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NotificationResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": errorResponse("Notification not found"),
      },
    },
    delete: {
      tags: ["Notifications"],
      summary: "Delete a notification",
      operationId: "deleteNotification",
      security: authenticatedMutation,
      parameters: [idParameter("notificationId")],
      responses: {
        "200": {
          description: "Notification deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": errorResponse("Notification not found"),
      },
    },
  },
  "/api/v1/notifications/read-all": {
    patch: {
      tags: ["Notifications"],
      summary: "Mark every unread notification as read",
      operationId: "markAllNotificationsRead",
      security: authenticatedMutation,
      responses: {
        "200": {
          description: "Count of rows updated",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UnreadCountResponse",
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

/** Reusable OpenAPI schemas exposed by the notifications module. */
export const notificationSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  Notification: {
    type: "object",
    required: [
      "id",
      "title",
      "body",
      "channel",
      "status",
      "data",
      "readAt",
      "sentAt",
      "createdAt",
    ],
    properties: {
      id: { $ref: "#/components/schemas/ResourceId" },
      title: { type: "string" },
      body: { type: "string" },
      channel: {
        type: "string",
        enum: ["EMAIL", "SMS", "WHATSAPP", "PUSH", "IN_APP"],
      },
      status: {
        type: "string",
        enum: ["PENDING", "SENT", "FAILED", "READ"],
      },
      data: {
        oneOf: [
          { type: "object", additionalProperties: true },
          { type: "null" },
        ],
      },
      readAt: { type: ["string", "null"], format: "date-time" },
      sentAt: { type: ["string", "null"], format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  NotificationResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["notification"],
        properties: {
          notification: { $ref: "#/components/schemas/Notification" },
        },
      },
    },
  },
  NotificationListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/Notification" },
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
  UnreadCountResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["count"],
        properties: { count: { type: "integer", minimum: 0 } },
      },
    },
  },
};
