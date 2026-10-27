import { API_BASE_PATH } from "@nikharta-roop/shared";
import { errorResponse } from "./common";

export const accountPaths = {
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
};

export const accountSchemas = {
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
};
