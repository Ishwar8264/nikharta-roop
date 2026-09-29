import type { MediaPurpose } from "@/generated/prisma/client";

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
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  result?: UploadedImage;
  previewUrl: string;
}

export interface UploadSignature {
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
