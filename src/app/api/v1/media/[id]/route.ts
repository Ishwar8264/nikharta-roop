import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  MediaAccessDeniedError,
  MediaNotFoundError,
} from "@/server/modules/media/media.errors";
import { mediaIdParamSchema } from "@/server/modules/media/media.schema";
import { deleteMediaAsset } from "@/server/modules/media/media.service";

/** Soft-deletes a media asset owned by the caller. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const validation = mediaIdParamSchema.safeParse(params);
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
    await deleteMediaAsset(auth.sub, validation.data.id);
    return NextResponse.json(
      { message: "Media deleted", data: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof MediaNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof MediaAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Media delete failed", error);
    return NextResponse.json(
      { message: "Unable to delete media" },
      { status: 500 },
    );
  }
}
