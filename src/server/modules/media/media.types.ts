import type { MediaPurpose } from "@/generated/prisma/client";

/**
 * Public shape returned to clients.
 *
 * Why Dates here (not strings):
 * Server code owns these types. The frontend has its own copy in
 * `features/media/types.ts` where dates are strings — JSON serialization
 * turns Date into string over HTTP, and the client type reflects that.
 */
export interface PublicMediaAsset {
  id: string;
  url: string;
  publicId: string;
  width: number | null;
  height: number | null;
  format: string | null;
  bytes: number | null;
  purpose: MediaPurpose;
  attachedToType: string | null;
  attachedToId: string | null;
  createdAt: Date;
}

/** Input for persisting a freshly uploaded Cloudinary asset. */
export interface CreateMediaAssetInput {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  purpose?: MediaPurpose;
  attachedToType?: string;
  attachedToId?: string;
}

/** Database input after ownership-derived fields have been added. */
export interface PersistMediaAssetInput extends CreateMediaAssetInput {
  folder: string;
}

/** Library query — paginated by cursor for stable ordering. */
export interface ListMediaQuery {
  cursor?: string;
  limit: number;
  purpose?: MediaPurpose;
  /** Only assets that are not yet attached to any entity. */
  unattached?: boolean;
}

export interface PaginatedMedia {
  items: PublicMediaAsset[];
  nextCursor: string | null;
  hasMore: boolean;
}
