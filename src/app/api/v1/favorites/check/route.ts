import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { checkFavoriteQuerySchema } from "@/server/modules/favorite/favorite.schema";
import { checkFavorite } from "@/server/modules/favorite/favorite.service";

/** Checks whether the given target is favorited by the caller. */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const validation = checkFavoriteQuerySchema.safeParse(
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
    const result = await checkFavorite(
      auth.sub,
      validation.data.type,
      validation.data.targetId,
    );
    return NextResponse.json(
      { message: "Favorite checked", data: result },
      { status: 200 },
    );
  } catch (error) {
    console.error("Favorite check failed", error);
    return NextResponse.json(
      { message: "Unable to check favorite" },
      { status: 500 },
    );
  }
}
