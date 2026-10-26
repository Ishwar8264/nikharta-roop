import type { UploadedImage } from "@nikharta-roop/shared/types/client/media";

/** Browser upload state retains the DOM File object only in the web app. */
export interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  result?: UploadedImage;
  previewUrl: string;
}
