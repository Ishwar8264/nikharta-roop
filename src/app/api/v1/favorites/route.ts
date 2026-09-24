import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  FavoriteAlreadyExistsError,
  FavoriteTargetNotFoundError,
} from "@/server/modules/favorite/favorite.errors";
import {
  addFavoriteSchema,
  listFavoritesQuerySchema,
} from "@/server/modules/favorite/favorite.schema";
import {
  addFavorite,
  listFavorites,
} from "@/server/modules/favorite/favorite.service";

/** Lists the caller's favorites. */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const validation = listFavoritesQuerySchema.safeParse(
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
    const result = await listFavorites(auth.sub, validation.data);
    return NextResponse.json(
      {
        message: "Favorites retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Favorite listing failed", error);
    return NextResponse.json(
      { message: "Unable to list favorites" },
      { status: 500 },
    );
  }
}

/** Adds a favorite. */
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

  const validation = addFavoriteSchema.safeParse(body);
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
    const favorite = await addFavorite(auth.sub, validation.data);
    return NextResponse.json(
      { message: "Favorite added", data: { favorite } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof FavoriteTargetNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof FavoriteAlreadyExistsError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error("Favorite add failed", error);
    return NextResponse.json(
      { message: "Unable to add favorite" },
      { status: 500 },
    );
  }
}
