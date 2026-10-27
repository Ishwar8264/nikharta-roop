import { ApiReference } from "@scalar/nextjs-api-reference";
import { getApiDocument } from "@/server/docs/document";

export const dynamic = "force-dynamic";

/** Render Scalar with an inline API description. */
export async function GET(): Promise<Response> {
  return ApiReference(
    {
      pageTitle: "Nikharta Roop API Documentation",
      theme: "purple",
      cdn: "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.75.0",
      content: await getApiDocument(),
    },
    { headers: { "Cache-Control": "no-store" } },
  )();
}
