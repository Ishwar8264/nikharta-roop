import { API_BASE_PATH, AUTH_BASE_PATH } from "@nikharta-roop/shared";
import { auth } from "@/server/auth";

export const dynamic = "force-dynamic";

/** Metadata only: calling the server API avoids requiring Redis just to browse documentation. */
export async function GET(): Promise<Response> {
  const document = await auth.api.generateOpenAPISchema();
  const authPaths = Object.fromEntries(
    Object.entries(document.paths).map(([path, operation]) => [
      `${AUTH_BASE_PATH}${path}`,
      operation,
    ]),
  );
  const errorResponse = (description: string, rateLimited = false) => ({
    description,
    ...(rateLimited
      ? {
          headers: {
            "Retry-After": { description: "Seconds before retrying.", schema: { type: "integer" } },
          },
        }
      : {}),
    content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
  });

  return Response.json(
    {
      ...document,
      info: {
        title: "Nikharta Roop API",
        version: "1.0.0",
        description:
          "Versioned auth and health APIs. Auth uses native Better Auth responses; health uses the shared JSON envelope.",
      },
      servers: [{ url: "/" }],
      paths: {
        ...authPaths,
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
      },
      components: {
        ...document.components,
        schemas: {
          ...document.components?.schemas,
          ApiError: {
            type: "object",
            required: ["ok", "error"],
            properties: {
              ok: { type: "boolean", enum: [false] },
              error: {
                type: "object",
                required: ["code", "message"],
                properties: { code: { type: "string" }, message: { type: "string" }, details: {} },
              },
            },
          },
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
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
