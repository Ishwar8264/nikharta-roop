/**
 * A single uploaded image asset.
 *
 * Why both url and publicId:
 * The URL is what the UI renders. The publicId is what Cloudinary needs to
 * delete or transform the asset later — and it is the ONLY way to remove
 * an orphan when a user deletes a salon, since Cloudinary's delete API
 * takes the id, not the URL.
 *
 * Storing only the URL (which is what the Salon schema does today) means
 * orphaned assets accumulate silently. Keeping publicId in the client
 * state lets a future cleanup job or a hard delete remove them.
 */
export interface UploadedImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

/** Per-file upload state shown in the UI. */
export interface UploadTask {
  /** Local id so React keys survive reordering. */
  id: string;
  file: File;
  /** 0–100. */
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  result?: UploadedImage;
  /** Object URL for the thumbnail. Revoked on removal. */
  previewUrl: string;
}

/** Payload returned by the signUpload Server Action. */
export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}
