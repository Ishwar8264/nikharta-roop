import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import type {
  ListMediaQuery,
  PersistMediaAssetInput,
  PublicMediaAsset,
} from "./media.types";

const PUBLIC_SELECT = {
  id: true,
  url: true,
  publicId: true,
  width: true,
  height: true,
  format: true,
  bytes: true,
  purpose: true,
  attachedToType: true,
  attachedToId: true,
  createdAt: true,
} satisfies Prisma.MediaAssetSelect;

/** Inserts a new media asset row. */
export async function createMediaAsset(
  userId: string,
  input: PersistMediaAssetInput,
): Promise<PublicMediaAsset> {
  return prisma.mediaAsset.create({
    data: {
      userId,
      url: input.url,
      publicId: input.publicId,
      folder: input.folder,
      width: input.width ?? null,
      height: input.height ?? null,
      format: input.format ?? null,
      bytes: input.bytes ?? null,
      purpose: input.purpose ?? "GENERAL",
      attachedToType: input.attachedToType ?? null,
      attachedToId: input.attachedToId ?? null,
    },
    select: PUBLIC_SELECT,
  });
}

/**
 * Cursor-paginated library query for a user.
 *
 * The id is a deterministic tiebreaker when timestamps are equal.
 */
export async function listMediaAssets(
  userId: string,
  query: ListMediaQuery,
): Promise<{
  items: PublicMediaAsset[];
  hasMore: boolean;
  nextCursor: string | null;
}> {
  const where: Prisma.MediaAssetWhereInput = {
    userId,
    deletedAt: null,
    NOT: { purpose: "VERIFICATION" },
    ...(query.purpose ? { purpose: query.purpose } : {}),
    ...(query.unattached ? { attachedToType: null, attachedToId: null } : {}),
  };

  // Fetch one extra row — if it comes back, there is a next page.
  const rows = await prisma.mediaAsset.findMany({
    where,
    select: PUBLIC_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > query.limit;
  const items = hasMore ? rows.slice(0, query.limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]!.id : null;

  return { items, hasMore, nextCursor };
}

/** Loads one asset without ownership check. Caller must authorize. */
export async function findMediaAssetById(
  id: string,
): Promise<(PublicMediaAsset & { userId: string }) | null> {
  return prisma.mediaAsset.findFirst({
    where: { id, deletedAt: null },
    select: { ...PUBLIC_SELECT, userId: true },
  });
}

/**
 * Soft-deletes a media asset.
 *
 * Why soft:
 * A hard delete would break any `Salon.images` URL that still references
 * this asset. Soft delete keeps the row so orphan scans can see the full
 * history and Cloudinary cleanup stays auditable.
 */
export async function softDeleteMediaAsset(id: string): Promise<void> {
  await prisma.mediaAsset.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

/** Marks an asset as attached to an entity. */
export async function attachMediaAsset(
  id: string,
  type: string,
  entityId: string,
): Promise<void> {
  await prisma.mediaAsset.updateMany({
    where: { id, deletedAt: null },
    data: { attachedToType: type, attachedToId: entityId },
  });
}
