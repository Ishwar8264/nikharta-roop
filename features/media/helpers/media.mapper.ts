import type { Prisma } from "@prisma/client";

import { mediaSelect } from "./media.selectors";

export type MediaRow = Prisma.MediaAssetGetPayload<{
  select: ReturnType<typeof mediaSelect>;
}>;

/**
 * Converts a media row into the admin API shape.
 */
export function toPublicMedia(media: MediaRow) {
  return media;
}
