import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { CatalogTemplateNotFoundError } from "@/server/modules/catalog/catalog.errors";
import {
  templateKeyParamSchema,
  updateSalonTemplateSchema,
} from "@/server/modules/catalog/catalog.schema";
import {
  deactivateSalonTemplate,
  updateSalonActivation,
} from "@/server/modules/catalog/catalog.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { salonRefParamSchema } from "@/server/modules/salon/salon.schema";

/** Updates a salon's template activation (price or on/off). MANAGER+. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ salonRef: string; templateKey: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = salonRefParamSchema
    .merge(templateKeyParamSchema)
    .safeParse(params);

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

  const bodyValidation = updateSalonTemplateSchema.safeParse(body);
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
    const activation = await updateSalonActivation(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.templateKey,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Activation updated", data: { template: activation } },
      { status: 200 },
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

    console.error("Activation update failed", error);
    return NextResponse.json(
      { message: "Unable to update activation" },
      { status: 500 },
    );
  }
}

/** Removes a salon's template activation. MANAGER+. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ salonRef: string; templateKey: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = salonRefParamSchema
    .merge(templateKeyParamSchema)
    .safeParse(params);

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
    await deactivateSalonTemplate(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.templateKey,
    );

    return NextResponse.json(
      { message: "Template deactivated", data: null },
      { status: 200 },
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

    console.error("Template deactivation failed", error);
    return NextResponse.json(
      { message: "Unable to deactivate template" },
      { status: 500 },
    );
  }
}
