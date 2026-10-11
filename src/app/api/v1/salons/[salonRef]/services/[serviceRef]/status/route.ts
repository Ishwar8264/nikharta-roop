import { NextResponse } from "next/server";

import { logDevApiEvent, unexpectedApiError } from "@/server/api/dev-response";
import { getAuthContext } from "@/server/auth/session";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import {
  ServiceCategoryNotFoundError,
  ServiceNotFoundError,
  ServiceSlugConflictError,
} from "@/server/modules/service/service.errors";
import {
  serviceParamSchema,
  updateServiceStatusSchema,
} from "@/server/modules/service/service.schema";
import {
  updateSalonService,
} from "@/server/modules/service/service.service";

/** Updates publication after creation. Requires salon MANAGER access. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ salonRef: string; serviceRef: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = serviceParamSchema.safeParse(params);

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

  if (!isResourceId(paramValidation.data.serviceRef)) {
    return NextResponse.json(
      { message: "Service reference must be a valid identifier" },
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

  const bodyValidation = updateServiceStatusSchema.safeParse(body);

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
    const service = await updateSalonService(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.serviceRef,
      bodyValidation.data,
    );
    logDevApiEvent("services.update.success", {
      userId: auth.sub,
      salonRef: paramValidation.data.salonRef,
      serviceId: service.id,
    });

    return NextResponse.json(
      { message: "Service status updated", data: { service } },
      { status: 200 },
    );
  } catch (error) {
    logDevApiEvent("services.update.rejected", {
      userId: auth.sub,
      salonRef: paramValidation.data.salonRef,
      serviceId: paramValidation.data.serviceRef,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof ServiceNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    if (error instanceof ServiceCategoryNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof ServiceSlugConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    return unexpectedApiError(
      "services.update.failed",
      error,
      "Unable to update service",
    );
  }
}
