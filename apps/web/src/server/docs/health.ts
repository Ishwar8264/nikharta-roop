import { API_BASE_PATH } from "@nikharta-roop/shared";
import { errorResponse } from "./common";

export const healthPaths = {
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
};

export const healthSchemas = {
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
};
