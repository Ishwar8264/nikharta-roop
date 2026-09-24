import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { FavoriteNotFoundError } from "@/server/modules/favorite/favorite.errors";
import { favoriteParamSchema } from "@/server/modules/favorite/favorite.schema";
import { removeFavorite } from "@/server/modules/favorite/favorite.service";

/** Removes a favorite by its id. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ favoriteId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const validation = favoriteParamSchema.safeParse(params);
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
    await removeFavorite(auth.sub, validation.data.favoriteId);
    return NextResponse.json(
      { message: "Favorite removed", data: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof FavoriteNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Favorite delete failed", error);
    return NextResponse.json(
      { message: "Unable to remove favorite" },
      { status: 500 },
    );
  }
}
