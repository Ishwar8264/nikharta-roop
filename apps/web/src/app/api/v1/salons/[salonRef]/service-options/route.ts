import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { unexpectedApiError } from "@/server/api/dev-response";
import { salonRefParamSchema, resourceIdSchema } from "@nikharta-roop/shared/schemas/salon";
import { SalonNotFoundError, SalonRoleInsufficientError } from "@/server/modules/salon/salon.errors";
import { listPackageServiceOptions } from "@/server/modules/service/service.service";

const querySchema = z.strictObject({ search: z.string().trim().max(80).optional(), cursor: resourceIdSchema.optional() });

/** Manager-only, paginated options for the package service selector. */
export async function GET(request: Request, context: { params: Promise<{ salonRef: string }> }) {
  const actor = await getAuthContext(request);
  if (!actor) return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  const params = salonRefParamSchema.safeParse(await context.params);
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!params.success || !query.success) return NextResponse.json({ message: "Invalid service options query" }, { status: 400 });
  try {
    const result = await listPackageServiceOptions(actor.sub, params.data.salonRef, query.data);
    return NextResponse.json({ data: result.items, meta: { hasMore: result.hasMore, nextCursor: result.nextCursor } });
  } catch (error) {
    if (error instanceof SalonNotFoundError) return NextResponse.json({ message: error.message }, { status: 404 });
    if (error instanceof SalonRoleInsufficientError) return NextResponse.json({ message: error.message }, { status: 403 });
    return unexpectedApiError("service-options.list.failed", error, "Unable to load services");
  }
}
