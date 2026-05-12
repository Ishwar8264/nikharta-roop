import { getDb } from "@/db";
import { MEDIA_CODES, MEDIA_MESSAGES } from "@/features/media/constants/media.constants";
import { mediaSelect } from "@/features/media/helpers/media.selectors";
import { listMediaQuerySchema } from "@/schema/media/schema.media";
import { handleMediaError } from "./media.errors";
import { mediaListResponse, parseMediaQuery } from "./media-list.shared";
import { mediaOwnerWhere } from "./media-owner.fields";
import { requireMediaAdmin } from "./media.shared";

/**
 * Handles admin media listing requests.
 */
export async function handleListMedia(request: Request) {
  const auth = await requireMediaAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseMediaQuery(request, listMediaQuerySchema);
  if (!query.success) return query.error;
  try {
    const media = await getDb().mediaAsset.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: mediaSelect(),
      take: query.data.limit ?? 50,
      where: { ...mediaOwnerWhere(query.data), ownerType: query.data.ownerType },
    });
    return mediaListResponse(media, query.data.limit ?? 50);
  } catch (error) {
    return handleMediaError(error, {
      code: MEDIA_CODES.MEDIA_LOAD_FAILED,
      handler: "handleListMedia",
      message: MEDIA_MESSAGES.MEDIA_LOAD_FAILED,
    });
  }
}
