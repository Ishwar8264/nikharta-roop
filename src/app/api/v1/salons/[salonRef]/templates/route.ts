import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  CatalogTemplateInactiveError,
  CatalogTemplateNotFoundError,
} from "@/server/modules/catalog/catalog.errors";
import { activateTemplateSchema } from "@/server/modules/catalog/catalog.schema";
import {
  activateSalonTemplate,
  listSalonActivatedTemplates,
} from "@/server/modules/catalog/catalog.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { salonRefParamSchema } from "@/server/modules/salon/salon.schema";

/** Lists the salon's activated templates. Public endpoint. */
export async function GET(
  request: Request,
  context: { params: Promise<{ salonRef: string }> },
): Promise<Response> {
  const params = await context.params;
  const paramValidation = salonRefParamSchema.safeParse(params);

  if (!paramValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: paramValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const templates = await listSalonActivatedTemplates(
      paramValidation.data.salonRef,
    );
    return NextResponse.json(
      { message: "Activated templates retrieved", data: templates },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error("Salon template listing failed", error);
    return NextResponse.json(
      { message: "Unable to list activated templates" },
      { status: 500 },
    );
  }
}

/**
 * Activates a catalog template for the salon with the salon's price.
 * MANAGER+ on the salon.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ salonRef: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = salonRefParamSchema.safeParse(params);

  if (!paramValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: paramValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const bodyValidation = activateTemplateSchema.safeParse(body);
  if (!bodyValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: bodyValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const activation = await activateSalonTemplate(
      auth.sub,
      paramValidation.data.salonRef,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Template activated", data: { template: activation } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof CatalogTemplateNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof CatalogTemplateInactiveError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("Template activation failed", error);
    return NextResponse.json(
      { message: "Unable to activate template" },
      { status: 500 },
    );
  }
}
