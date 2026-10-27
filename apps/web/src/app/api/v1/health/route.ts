import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";
import { getHealthStatus } from "@/server/health";
import { checkRateLimit } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

/** Public readiness endpoint. Apply the shared API budget before checking dependencies. */
export async function GET(request: Request): Promise<Response> {
  const headers = new Headers({ "Cache-Control": "no-store" });
  try {
    // Deploy behind a proxy that replaces client-provided forwarding headers.
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const budget = await checkRateLimit(`health:${ip}`);
    headers.set("X-RateLimit-Limit", String(budget.limit));
    headers.set("X-RateLimit-Remaining", String(budget.remaining));
    headers.set("X-RateLimit-Reset", String(budget.reset));
    if (!budget.success) {
      headers.set(
        "Retry-After",
        String(Math.max(1, Math.ceil((budget.reset - Date.now()) / 1000))),
      );
      return jsonError(
        429,
        "RATE_LIMITED",
        "Too many requests. Please try again shortly.",
        undefined,
        { headers },
      );
    }
    const health = await getHealthStatus();
    if (health.status !== "ok") {
      return jsonError(
        503,
        "DEPENDENCY_UNAVAILABLE",
        "A required service is unavailable.",
        health,
        { headers },
      );
    }
    return jsonOk(health, { headers });
  } catch (error) {
    return handleApiError(error, { headers });
  }
}
