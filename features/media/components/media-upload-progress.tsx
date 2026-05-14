"use client";

type MediaUploadProgressProps = {
  isUploading: boolean;
  message: string;
};

// Bottom status bar for upload progress and errors.
export function MediaUploadProgress({
  isUploading,
  message,
}: MediaUploadProgressProps) {
  return (
    <div className="space-y-2">
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-rose-900 transition-all"
          style={{ width: isUploading ? "70%" : message ? "100%" : "0%" }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {isUploading ? "Uploading media..." : message || "Ready to upload."}
      </p>
    </div>
  );
}
