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
  updateServiceSchema,
} from "@/server/modules/service/service.schema";
import {
  deleteSalonService,
  getSalonService,
  updateSalonService,
} from "@/server/modules/service/service.service";

/**
 * Public detail lookup by slug.
 *
 * Why:
 * Id-shaped references are rejected so callers cannot probe the internal id
 * space through the slug lookup path.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ salonRef: string; serviceRef: string }> },
): Promise<Response> {
  const params = await context.params;
  const validation = serviceParamSchema.safeParse(params);

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

  if (isResourceId(validation.data.serviceRef)) {
    return NextResponse.json({ message: "Service not found" }, { status: 404 });
  }

  try {
    const service = await getSalonService(
      validation.data.salonRef,
      validation.data.serviceRef,
    );
    logDevApiEvent("services.detail.success", {
      salonRef: validation.data.salonRef,
      serviceId: service.id,
    });

    return NextResponse.json(
      { message: "Service retrieved", data: { service } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof ServiceNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    return unexpectedApiError(
      "services.detail.failed",
      error,
      "Unable to retrieve service",
    );
  }
}

/** Partial update. Requires MANAGER on the parent salon. */
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

  const bodyValidation = updateServiceSchema.safeParse(body);

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
      { message: "Service updated", data: { service } },
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

/** Soft-deletes a service. Requires MANAGER on the parent salon. */
export async function DELETE(
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

  try {
    await deleteSalonService(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.serviceRef,
    );
    logDevApiEvent("services.delete.success", {
      userId: auth.sub,
      salonRef: paramValidation.data.salonRef,
      serviceId: paramValidation.data.serviceRef,
    });

    return NextResponse.json(
      { message: "Service deleted", data: null },
      { status: 200 },
    );
  } catch (error) {
    logDevApiEvent("services.delete.rejected", {
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

    return unexpectedApiError(
      "services.delete.failed",
      error,
      "Unable to delete service",
    );
  }
}
