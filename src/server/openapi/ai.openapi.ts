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

/** OpenAPI paths exposed by the AI module. */
export const aiPaths = {
  "/api/v1/ai/chats": {
    get: {
      tags: ["AI"],
      summary: "List the caller's AI chats",
      operationId: "listAiChats",
      security: authenticatedRead,
      parameters: [
        { $ref: "#/components/parameters/CursorParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": {
          description: "Paginated chat list",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AiChatListResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
    post: {
      tags: ["AI"],
      summary: "Create a new chat",
      description:
        "Opens a chat session. `contextType` selects the domain grounding: " +
        "`GENERAL` has no entity, while `STAFF`, `PRODUCT`, and `SERVICE` " +
        "require a matching `contextId`. The system prompt is built " +
        "server-side from that entity's current data.",
      operationId: "createAiChat",
      security: authenticatedMutation,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateAiChatRequest" },
            examples: {
              general: {
                summary: "General purpose chat",
                value: { contextType: "GENERAL" },
              },
              aboutService: {
                summary: "Chat grounded in one service",
                value: {
                  contextType: "SERVICE",
                  contextId: "7a2c4e5f6879a1b2c3d4e5f6789a0b1c2d3e4f5a6b7c8d9e",
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Chat created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AiChatResponse" },
            },
          },
        },
        "400": errorResponse(
          "Validation failure or context entity does not exist",
        ),
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/v1/ai/chats/{chatId}": {
    get: {
      tags: ["AI"],
      summary: "Get a chat with its message history",
      operationId: "getAiChat",
      security: authenticatedRead,
      parameters: [idParameter("chatId")],
      responses: {
        "200": {
          description: "Chat with messages",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AiChatWithMessagesResponse",
              },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": errorResponse("Chat not found"),
      },
    },
    patch: {
      tags: ["AI"],
      summary: "Rename a chat",
      description:
        "Only `title` is mutable. The context type and id are immutable " +
        "after creation to keep the system prompt stable across the " +
        "conversation.",
      operationId: "renameAiChat",
      security: authenticatedMutation,
      parameters: [idParameter("chatId")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RenameAiChatRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Chat renamed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AiChatResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": errorResponse("Chat not found"),
      },
    },
    delete: {
      tags: ["AI"],
      summary: "Delete a chat",
      description:
        "Removes the chat and every message and usage log attached to it, " +
        "inside a single transaction.",
      operationId: "deleteAiChat",
      security: authenticatedMutation,
      parameters: [idParameter("chatId")],
      responses: {
        "200": {
          description: "Chat deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": errorResponse("Chat not found"),
      },
    },
  },
  "/api/v1/ai/chats/{chatId}/messages": {
    post: {
      tags: ["AI"],
      summary: "Stream an assistant response",
      description:
        "Server-Sent Events stream of the assistant's reply. The request " +
        "body carries the full `UIMessage[]` array (as produced by the " +
        "Vercel AI SDK `useChat` hook). The server converts those messages " +
        "to model messages, prepends the chat's system prompt, and streams " +
        "the response. Only the last user + assistant pair is persisted on " +
        "completion.\n\n" +
        "The stream aborts if the client closes the connection. Token usage " +
        "is recorded in `UserAiUsage` and `AiUsageLog` when the stream ends " +
        "naturally.\n\n" +
        "**Runtime:** Node.js (Prisma writes in `onFinish`).\n\n" +
        "**Max duration:** 60 seconds.\n\n" +
        "**Status codes:** `200` with a stream when the provider is " +
        "configured; `503` when no provider key is set; `429` when the " +
        "user's quota is exhausted; `404` when the chat does not exist.",
      operationId: "streamAiMessage",
      security: authenticatedMutation,
      parameters: [idParameter("chatId")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/StreamAiMessageRequest" },
            examples: {
              firstMessage: {
                summary: "First message in a chat",
                value: {
                  messages: [
                    {
                      role: "user",
                      parts: [{ type: "text", text: "Hello!" }],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description:
            "Streaming response. Content-Type is `text/event-stream`; the " +
            "body is a sequence of SSE events matching the Vercel AI SDK " +
            "UIMessage stream protocol.",
          content: {
            "text/event-stream": {
              schema: {
                type: "string",
                description:
                  "Server-Sent Events stream. Each event carries a JSON " +
                  "payload describing a piece of the assistant's reply.",
              },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": errorResponse("Chat not found"),
        "429": errorResponse("Daily, weekly, or monthly token quota exceeded"),
        "503": errorResponse("AI provider not configured"),
      },
    },
  },
  "/api/v1/ai/usage": {
    get: {
      tags: ["AI"],
      summary: "Get the caller's AI quota summary",
      description:
        "Returns the used/limit counters for the daily, weekly, and " +
        "monthly windows, plus the reset time for each. Expired windows " +
        "are rolled forward on read so the counters always reflect the " +
        "state the next streaming request will see.",
      operationId: "getAiUsage",
      security: authenticatedRead,
      responses: {
        "200": {
          description: "Quota summary",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AiUsageResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

/** Reusable OpenAPI schemas exposed by the AI module. */
export const aiSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  AiContextType: {
    type: "string",
    enum: ["GENERAL", "STAFF", "PRODUCT", "SERVICE"],
  },
  AiChat: {
    type: "object",
    required: ["id", "title", "contextType", "contextId", "createdAt"],
    properties: {
      id: { $ref: "#/components/schemas/ResourceId" },
      title: { type: ["string", "null"] },
      contextType: { $ref: "#/components/schemas/AiContextType" },
      contextId: {
        oneOf: [{ $ref: "#/components/schemas/ResourceId" }, { type: "null" }],
      },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  AiMessage: {
    type: "object",
    required: ["id", "role", "content", "tokens", "createdAt"],
    properties: {
      id: { $ref: "#/components/schemas/ResourceId" },
      role: { type: "string", enum: ["user", "assistant", "system"] },
      content: { type: "string" },
      tokens: { type: "integer", minimum: 0 },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  CreateAiChatRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string", maxLength: 120 },
      contextType: {
        allOf: [{ $ref: "#/components/schemas/AiContextType" }],
        default: "GENERAL",
      },
      contextId: { $ref: "#/components/schemas/ResourceId" },
    },
  },
  RenameAiChatRequest: {
    type: "object",
    additionalProperties: false,
    required: ["title"],
    properties: {
      title: { type: "string", minLength: 1, maxLength: 120 },
    },
  },
  StreamAiMessageRequest: {
    type: "object",
    additionalProperties: false,
    required: ["messages"],
    properties: {
      messages: {
        type: "array",
        minItems: 1,
        maxItems: 100,
        items: {
          type: "object",
          required: ["role"],
          properties: {
            id: { type: "string" },
            role: { type: "string", enum: ["user", "assistant", "system"] },
            parts: {
              type: "array",
              items: { type: "object", additionalProperties: true },
              description:
                "Vercel AI SDK UIMessage parts. Text parts are extracted for " +
                "persistence; other part types are ignored by the server.",
            },
            content: {
              type: "string",
              description:
                "Legacy plain-text content. Accepted as an alternative to " +
                "`parts` for simple clients.",
            },
          },
        },
      },
    },
  },
  AiQuotaWindow: {
    type: "object",
    required: ["used", "limit", "resetAt"],
    properties: {
      used: { type: "integer", minimum: 0 },
      limit: { type: "integer", minimum: 0 },
      resetAt: { type: "string", format: "date-time" },
    },
  },
  AiUsage: {
    type: "object",
    required: ["isBlocked", "blockReason", "daily", "weekly", "monthly"],
    properties: {
      isBlocked: { type: "boolean" },
      blockReason: { type: ["string", "null"] },
      daily: { $ref: "#/components/schemas/AiQuotaWindow" },
      weekly: { $ref: "#/components/schemas/AiQuotaWindow" },
      monthly: { $ref: "#/components/schemas/AiQuotaWindow" },
    },
  },
  AiChatResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["chat"],
        properties: {
          chat: { $ref: "#/components/schemas/AiChat" },
        },
      },
    },
  },
  AiChatWithMessagesResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["chat", "messages"],
        properties: {
          chat: { $ref: "#/components/schemas/AiChat" },
          messages: {
            type: "array",
            items: { $ref: "#/components/schemas/AiMessage" },
          },
        },
      },
    },
  },
  AiChatListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/AiChat" },
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
  AiUsageResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["usage"],
        properties: {
          usage: { $ref: "#/components/schemas/AiUsage" },
        },
      },
    },
  },
};
