import type { OpenAPIV3_1 } from "openapi-types";

/** System paths: health check. */
export const systemPaths = {
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
} as unknown as OpenAPIV3_1.PathsObject;

/** System schemas: health responses. */
export const systemSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
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

        // ============================================================
        // SALON SCHEMAS  ← YE BHI MISSING THE
        // ============================================================
};
