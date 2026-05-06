import { getDb } from "@/db";
import { MEDIA_CODES, MEDIA_MESSAGES } from "@/features/media/constants/media.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { getMediaOwner } from "./media-owner.fields";
import { MediaVisibleError, type MediaAdminUser } from "./media.shared";

type MediaOwnerInput = Record<string, unknown>;

/**
 * Verifies the selected owner row exists and is manageable.
 */
export async function assertMediaOwner(input: MediaOwnerInput, admin: MediaAdminUser) {
  const ownerField = getMediaOwner(input);
  if (!ownerField) return;
  const branchId = await resolveOwnerBranch(ownerField, input[ownerField] as string);
  if (admin.role === "SUPER_ADMIN" || !branchId || admin.branchId === branchId) return;
  throw new MediaVisibleError(
    MEDIA_CODES.FORBIDDEN,
    MEDIA_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}

/**
 * Loads a media row and validates branch ownership through its owner ids.
 */
export async function assertManageableMedia(mediaId: string, admin: MediaAdminUser) {
  const media = await getDb().mediaAsset.findUnique({ where: { id: mediaId } });
  if (!media) return null;
  await assertMediaOwner(media, admin);
  return media;
}

/**
 * Resolves branch ownership for one media owner id field.
 */
async function resolveOwnerBranch(ownerField: string, ownerId: string) {
  const loaders = {
    blogPostId: () => getDb().blogPost.findUnique({ select: { id: true }, where: { id: ownerId } }),
    branchId: () => getDb().branch.findUnique({ select: { id: true }, where: { id: ownerId } }),
    packageId: () => getDb().package.findUnique({ select: { branchId: true }, where: { id: ownerId } }),
    portfolioItemId: () => getDb().portfolioItem.findUnique({ select: { branchId: true }, where: { id: ownerId } }),
    productId: () => getDb().product.findUnique({ select: { branchId: true }, where: { id: ownerId } }),
    reviewId: () => getDb().review.findUnique({ select: { booking: { select: { branchId: true } } }, where: { id: ownerId } }),
    serviceId: () => getDb().service.findUnique({ select: { branchId: true }, where: { id: ownerId } }),
    staffId: () => getDb().staff.findUnique({ select: { branchId: true }, where: { id: ownerId } }),
  };
  const row = await loaders[ownerField as keyof typeof loaders]();
  if (!row) throwOwnerNotFound();
  if ("branchId" in row) return row.branchId;
  if ("booking" in row) return row.booking.branchId;
  if ("id" in row && ownerField === "branchId") return row.id;
  return null;
}

/**
 * Throws a media owner not-found error.
 */
function throwOwnerNotFound(): never {
  throw new MediaVisibleError(
    MEDIA_CODES.MEDIA_OWNER_NOT_FOUND,
    MEDIA_MESSAGES.MEDIA_OWNER_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
