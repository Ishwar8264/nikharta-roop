"use server";

import type { MediaPurpose } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth/get-session";
import { listMediaQuerySchema } from "@/server/modules/media/media.schema";
import { listUserMedia } from "@/server/modules/media/media.service";

import type { MediaAsset } from "../types";

/**
 * Server Action: fetches a page of the caller's media library.
 *
 * Why a Server Action instead of a server component fetch:
 * The library is loaded on demand when the user opens the "Library" tab —
 * not on page render. A Server Action is the natural RPC for that gesture.
 */
export async function listMedia(
  options: {
    cursor?: string;
    limit?: number;
    purpose?: MediaPurpose;
    unattached?: boolean;
  } = {},
): Promise<{
  items: MediaAsset[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const user = await getSession();
  if (!user) throw new Error("Authentication required");

  const validation = listMediaQuerySchema.safeParse(options);
  if (!validation.success) throw new Error(validation.error.issues[0]!.message);

  const result = await listUserMedia(user.id, validation.data);

  return {
    items: result.items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  };
}
