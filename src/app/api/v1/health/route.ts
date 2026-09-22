import { getHealthStatus } from "@/server/modules/health/health.service";

// A health response must always reflect the current database state.
export const dynamic = "force-dynamic";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

/**
 * Reports whether the API and its database dependency are available.
 *
 * Why:
 * Deployment platforms and monitoring tools need one lightweight endpoint
 * before sending user traffic to an application instance.
 */
export async function GET(): Promise<Response> {
  try {
    const health = await getHealthStatus();

    return Response.json(health, {
      status: 200,
      headers: RESPONSE_HEADERS,
    });
  } catch {
    // Database errors can contain infrastructure details, so expose only state.
    return Response.json(
      {
        status: "error",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: RESPONSE_HEADERS,
      },
    );
  }
}
