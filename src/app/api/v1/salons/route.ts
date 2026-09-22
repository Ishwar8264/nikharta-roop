import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { SlugConflictError } from "@/server/modules/salon/salon.errors";
import {
  createSalonSchema,
  listSalonsQuerySchema,
} from "@/server/modules/salon/salon.schema";
import { createSalon, listSalons } from "@/server/modules/salon/salon.service";

/**
 * Lists active salons with cursor pagination and optional filters.
 *
 * Why:
 * Public endpoint — no authentication required. Cursor pagination is used
 * instead of offset so results stay stable as new salons are created.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rawQuery = Object.fromEntries(url.searchParams.entries());

  const validation = listSalonsQuerySchema.safeParse(rawQuery);

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
    const result = await listSalons(validation.data);

    return NextResponse.json(
      {
        message: "Salons retrieved",
        data: result.items,
        meta: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Salon listing failed", error);
    return NextResponse.json(
      { message: "Unable to list salons" },
      { status: 500 },
    );
  }
}

/**
 * Creates a new salon and records the caller as its initial OWNER.
 *
 * Why:
 * Any authenticated user can open a salon. Ownership is tracked through
 * `SalonMember` so a single user can manage multiple salons.
 */
export async function POST(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
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

  const validation = createSalonSchema.safeParse(body);

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
    const salon = await createSalon(auth.sub, validation.data);

    return NextResponse.json(
      { message: "Salon created", data: { salon } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SlugConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("Salon creation failed", error);
    return NextResponse.json(
      { message: "Unable to create salon" },
      { status: 500 },
    );
  }
}
