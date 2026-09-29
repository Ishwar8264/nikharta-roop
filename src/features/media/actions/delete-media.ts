"use server";

import { getSession } from "@/lib/auth/get-session";
import { mediaIdParamSchema } from "@/server/modules/media/media.schema";
import { deleteMediaAsset } from "@/server/modules/media/media.service";

/** Server Action: soft-deletes a media asset the caller owns. */
export async function deleteMedia(assetId: string): Promise<void> {
  const user = await getSession();
  if (!user) throw new Error("Authentication required");

  const validation = mediaIdParamSchema.safeParse({ id: assetId });
  if (!validation.success) throw new Error(validation.error.issues[0]!.message);

  await deleteMediaAsset(user.id, validation.data.id);
}
