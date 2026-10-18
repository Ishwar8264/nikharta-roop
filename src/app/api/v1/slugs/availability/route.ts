import { NextResponse } from "next/server";

import { unexpectedApiError } from "@/server/api/dev-response";
import { getAuthContext } from "@/server/auth/session";
import { SalonAccessDeniedError, SalonNotFoundError, SalonRoleInsufficientError } from "@/server/modules/salon/salon.errors";
import { slugAvailabilityQuerySchema } from "@/server/modules/slug/slug.schema";
import { checkSlugAvailability } from "@/server/modules/slug/slug.service";

/** One authenticated check for every supported slug namespace; never reserves a slug. */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) return NextResponse.json({ message: "Authentication required" }, { status: 401 });

  const query = new URL(request.url).searchParams;
  // Duplicate parameters would otherwise be silently overwritten by Object.fromEntries.
  if (new Set(query.keys()).size !== [...query.keys()].length) {
    return NextResponse.json({ message: "Query parameters must not be repeated" }, { status: 400 });
  }
  const validation = slugAvailabilityQuerySchema.safeParse(Object.fromEntries(query));
  if (!validation.success) {
    return NextResponse.json({
      message: "Validation failed",
      errors: validation.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
    }, { status: 400 });
  }

  try {
    const data = await checkSlugAvailability(auth, validation.data);
    return NextResponse.json({ message: "Slug availability checked", data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof SalonAccessDeniedError || error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: "You do not have permission to check slugs for this resource" }, { status: 403 });
    }
    return unexpectedApiError("slugs.availability.failed", error, "Unable to check slug availability");
  }
}
