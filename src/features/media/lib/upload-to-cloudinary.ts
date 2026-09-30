import type { UploadSignature, UploadedImage } from "../types";

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

interface UploadOptions {
  file: File;
  signature: UploadSignature;
  /** Fires with 0–100 as the browser reports progress. */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

/**
 * Uploads one file directly to Cloudinary.
 *
 * Why XMLHttpRequest and not fetch:
 * `fetch` has no upload progress event. To render a real progress bar we
 * need `xhr.upload.onprogress`. This is the only place in the app that
 * needs XHR — everything else uses fetch — so we isolate it here instead
 * of dragging XHR semantics into the general API client.
 *
 * Why the file never touches our server:
 * Routing a 5 MB image through a Next.js route handler would consume
 * serverless bandwidth and memory for every upload. Cloudinary receives
 * the file directly; our backend only ever sees the resulting URL string.
 */
export function uploadToCloudinary({
  file,
  signature,
  onProgress,
  signal,
}: UploadOptions): Promise<UploadedImage> {
  const { cloudName, apiKey, timestamp, signature: signed, publicId } =
    signature;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signed);
  formData.append("public_id", publicId);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as CloudinaryResponse;
          resolve({
            url: data.secure_url,
            publicId: data.public_id,
            width: data.width,
            height: data.height,
            format: data.format,
            bytes: data.bytes,
          });
        } catch {
          reject(new Error("Invalid response from Cloudinary"));
        }
        return;
      }

      // Cloudinary returns a JSON error body for rejected uploads. Surface
      // its message so the user sees "file too large" instead of "failed".
      let message = `Upload failed (${xhr.status})`;
      try {
        const body = JSON.parse(xhr.responseText) as {
          error?: { message?: string };
        };
        if (body.error?.message) message = body.error.message;
      } catch {
        /* fall through with the default message */
      }
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));

    signal?.addEventListener("abort", () => xhr.abort());

    xhr.send(formData);
  });
}
