import { getDb } from "@/db";
import { MEDIA_CODES, MEDIA_MESSAGES } from "@/features/media/constants/media.constants";
import { mediaJson } from "@/features/media/responses/media.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { handleMediaError, throwMediaNotFound } from "./media.errors";
import { assertManageableMedia } from "./media.guards";
import { requireMediaAdmin, type MediaAdminUser } from "./media.shared";

/**
 * Handles admin media delete requests.
 */
export async function handleDeleteMedia(request: Request, mediaId: string) {
  const auth = await requireMediaAdmin(request);
  if (!auth.success) return auth.error;
  return deleteMedia(mediaId, auth.session.user);
}

/**
 * Deletes one media metadata row after owner validation.
 */
async function deleteMedia(mediaId: string, admin: MediaAdminUser) {
  try {
    const current = await assertManageableMedia(mediaId, admin);
    if (!current) throwMediaNotFound();
    await getDb().mediaAsset.delete({ where: { id: mediaId } });
    return mediaJson({
      code: MEDIA_CODES.MEDIA_DELETED,
      data: { mediaId },
      message: MEDIA_MESSAGES.MEDIA_DELETED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleMediaError(error, {
      code: MEDIA_CODES.MEDIA_DELETE_FAILED,
      handler: "deleteMedia",
      message: MEDIA_MESSAGES.MEDIA_DELETE_FAILED,
    });
  }
}
