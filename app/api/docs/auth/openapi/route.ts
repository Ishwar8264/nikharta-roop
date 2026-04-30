import { GET as getOpenApi } from "@/app/api/docs/openapi/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return getOpenApi(request);
}
