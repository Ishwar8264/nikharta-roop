import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  MediaAccessDeniedError,
  MediaAlreadyExistsError,
} from "@/server/modules/media/media.errors";
import {
  createMediaAssetSchema,
  listMediaQuerySchema,
} from "@/server/modules/media/media.schema";
import {
  listUserMedia,
  saveMediaAsset,
} from "@/server/modules/media/media.service";

/**
 * Lists the current user's media library.
 *
 * Why authenticated:
 * A media library is per-user data. There is no public read path — even
 * profile avatars are rendered from their URL, not from this endpoint.
 */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const rawQuery = Object.fromEntries(url.searchParams.entries());
  const validation = listMediaQuerySchema.safeParse(rawQuery);

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
    const result = await listUserMedia(auth.sub, validation.data);
    return NextResponse.json(
      {
        message: "Media retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Media listing failed", error);
    return NextResponse.json(
      { message: "Unable to list media" },
      { status: 500 },
    );
  }
}

/**
 * Persists a Cloudinary asset after the browser uploaded it.
 *
 * Why not the upload itself:
 * The file never travels through this server. Cloudinary receives it
 * directly; this endpoint only records the resulting URL and publicId so
 * the asset shows up in the user's library and can be deleted later.
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

  const validation = createMediaAssetSchema.safeParse(body);
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
    const asset = await saveMediaAsset(auth.sub, validation.data);
    return NextResponse.json(
      { message: "Media saved", data: { asset } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof MediaAlreadyExistsError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof MediaAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Media save failed", error);
    return NextResponse.json(
      { message: "Unable to save media" },
      { status: 500 },
    );
  }
}
