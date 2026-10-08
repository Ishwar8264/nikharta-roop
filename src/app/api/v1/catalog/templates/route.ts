import { NextResponse } from "next/server";

import { listTemplatesQuerySchema } from "@/server/modules/catalog/catalog.schema";
import { listCatalogTemplates } from "@/server/modules/catalog/catalog.service";

/**
 * Lists the platform catalog of service/package templates.
 *
 * Why public:
 * Salon onboarding browses this before signing in — activation (the write
 * path) is separately protected under the salon's management routes.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const validation = listTemplatesQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const templates = await listCatalogTemplates(validation.data);
    return NextResponse.json(
      { message: "Templates retrieved", data: templates },
      { status: 200 },
    );
  } catch (error) {
    console.error("Catalog listing failed", error);
    return NextResponse.json(
      { message: "Unable to list catalog templates" },
      { status: 500 },
    );
  }
}
