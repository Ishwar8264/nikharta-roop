import { getDb } from "@/db";
import { MEDIA_CODES, MEDIA_MESSAGES } from "@/features/media/constants/media.constants";
import { mediaSelect } from "@/features/media/helpers/media.selectors";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  createMediaSchema,
  updateMediaSchema,
  type CreateMediaInput,
  type UpdateMediaInput,
} from "@/schema/media/schema.media";
import { handleMediaError, throwMediaNotFound } from "./media.errors";
import { assertManageableMedia, assertMediaOwner } from "./media.guards";
import { mediaDetailResponse } from "./media-list.shared";
import { parseMediaBody, requireMediaAdmin, type MediaAdminUser } from "./media.shared";

/**
 * Handles admin media creation requests.
 */
export async function handleCreateMedia(request: Request) {
  const auth = await requireMediaAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseMediaBody(request, createMediaSchema);
  if (body.error) return body.error;
  return createMedia(body.data, auth.session.user);
}

/**
 * Handles admin media patch requests.
 */
export async function handleUpdateMedia(request: Request, mediaId: string) {
  const auth = await requireMediaAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseMediaBody(request, updateMediaSchema);
  if (body.error) return body.error;
  return updateMedia(mediaId, body.data, auth.session.user);
}

/**
 * Creates one media metadata row after owner validation.
 */
async function createMedia(input: CreateMediaInput, admin: MediaAdminUser) {
  try {
    await assertMediaOwner(input, admin);
    const media = await getDb().mediaAsset.create({
      data: input,
      select: mediaSelect(),
    });
    return mediaDetailResponse(media, MEDIA_CODES.MEDIA_CREATED, HTTP_STATUS.CREATED);
  } catch (error) {
    return handleMediaError(error, {
      code: MEDIA_CODES.MEDIA_CREATE_FAILED,
      handler: "createMedia",
      message: MEDIA_MESSAGES.MEDIA_CREATE_FAILED,
    });
  }
}

/**
 * Updates one media metadata row after owner validation.
 */
async function updateMedia(mediaId: string, input: UpdateMediaInput, admin: MediaAdminUser) {
  try {
    const current = await assertManageableMedia(mediaId, admin);
    if (!current) throwMediaNotFound();
    await assertMediaOwner(input, admin);
    const media = await getDb().mediaAsset.update({
      data: input,
      select: mediaSelect(),
      where: { id: mediaId },
    });
    return mediaDetailResponse(media, MEDIA_CODES.MEDIA_UPDATED);
  } catch (error) {
    return handleMediaError(error, {
      code: MEDIA_CODES.MEDIA_UPDATE_FAILED,
      handler: "updateMedia",
      message: MEDIA_MESSAGES.MEDIA_UPDATE_FAILED,
    });
  }
}
