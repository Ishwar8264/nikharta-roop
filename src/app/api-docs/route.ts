import { areApiDocsEnabled } from "@/server/openapi/openapi.config";
import { getOpenApiDocument } from "@/server/openapi/openapi.document";

/** Returns the machine-readable OpenAPI contract used by Swagger UI. */
export function GET(): Response {
  if (!areApiDocsEnabled()) {
    return Response.json({ message: "Not found" }, { status: 404 });
  }

  return Response.json(getOpenApiDocument(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
