import { NextResponse } from "next/server";

import { logDevApiEvent, unexpectedApiError } from "@/server/api/dev-response";
import { getAuthContext } from "@/server/auth/session";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { salonRefParamSchema } from "@/server/modules/salon/salon.schema";
import {
  ServiceCategoryNotFoundError,
  ServiceSlugConflictError,
} from "@/server/modules/service/service.errors";
import {
  createServiceSchema,
  listServicesQuerySchema,
} from "@/server/modules/service/service.schema";
import {
  createSalonService,
  listSalonServices,
} from "@/server/modules/service/service.service";

/**
 * Lists a salon's active services. Public endpoint.
 */
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

  const url = new URL(request.url);
  const rawQuery = Object.fromEntries(url.searchParams.entries());

  const queryValidation = listServicesQuerySchema.safeParse(rawQuery);

  if (!queryValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: queryValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const result = await listSalonServices(
      paramValidation.data.salonRef,
      queryValidation.data,
    );
    logDevApiEvent("services.list.success", {
      salonRef: paramValidation.data.salonRef,
      count: result.items.length,
      hasMore: result.hasMore,
    });

    return NextResponse.json(
      {
        message: "Services retrieved",
        data: result.items,
        meta: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    return unexpectedApiError(
      "services.list.failed",
      error,
      "Unable to list services",
    );
  }
}

/**
 * Creates a service inside a salon the caller manages.
 *
 * Why:
 * Requires at least MANAGER on the parent salon. Nested resources inherit
 * authorization from their parent — the parent lookup and role check happen
 * together in `createSalonService`.
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

  const bodyValidation = createServiceSchema.safeParse(body);

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
    const service = await createSalonService(
      auth.sub,
      paramValidation.data.salonRef,
      bodyValidation.data,
    );
    logDevApiEvent("services.create.success", {
      userId: auth.sub,
      salonRef: paramValidation.data.salonRef,
      serviceId: service.id,
    });

    return NextResponse.json(
      { message: "Service created", data: { service } },
      { status: 201 },
    );
  } catch (error) {
    logDevApiEvent("services.create.rejected", {
      userId: auth.sub,
      salonRef: paramValidation.data.salonRef,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    if (error instanceof SalonNotFoundError) {
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
      "services.create.failed",
      error,
      "Unable to create service",
    );
  }
}
