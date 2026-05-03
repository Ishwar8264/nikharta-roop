import { GET as getOpenApi } from "@/app/api/docs/openapi/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Keeps the legacy auth OpenAPI URL pointing at the unified API spec.
 */
export function GET(request: Request) {
  return getOpenApi(request);
}
