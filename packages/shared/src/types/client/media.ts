import type { MediaPurpose } from "@nikharta-roop/shared/enums";

/** Client-safe media shape (dates as strings from JSON). */
export interface MediaAsset {
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
  createdAt: string;
}

export interface UploadedImage {
  mediaId?: string;
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface UploadSignature {
  type?: "authenticated";
  overwrite?: false;
  allowedFormats?: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
}

export interface MediaListResponse {
  message: string;
  data: MediaAsset[];
  meta: { nextCursor: string | null; hasMore: boolean };
}

export interface SaveMediaResponse {
  message: string;
  data: { asset: MediaAsset };
}
