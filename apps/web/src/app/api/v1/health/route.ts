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
      return Response.json(
        { message: "Too many requests. Please try again shortly." },
        { status: 429, headers },
      );
    }
    const health = await getHealthStatus();
    return Response.json(health, { status: health.status === "ok" ? 200 : 503, headers });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503, headers });
  }
}
