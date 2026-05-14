"use client";

import { ImageUp } from "lucide-react";

type MediaUploadDropzoneProps = {
  accept: string;
  disabled?: boolean;
  helperText?: string;
  onFileChange: (file: File) => void;
};

// File picker surface shared by avatar and future media upload flows.
export function MediaUploadDropzone({
  accept,
  disabled,
  helperText,
  onFileChange,
}: MediaUploadDropzoneProps) {
  return (
    <label className="grid min-h-56 cursor-pointer place-items-center rounded-xl border border-dashed bg-white p-5 text-center transition hover:bg-rose-50/40">
      <span className="grid gap-2">
        <span className="mx-auto grid size-10 place-items-center rounded-full bg-rose-100 text-rose-900">
          <ImageUp className="size-5" />
        </span>
        <span className="font-medium text-stone-950">Upload media</span>
        <span className="text-xs text-muted-foreground">
          {helperText ?? "Choose an image from your device."}
        </span>
      </span>
      <input
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          // Only one avatar file is accepted per interaction.
          const file = event.currentTarget.files?.[0];

          if (file) onFileChange(file);
        }}
        type="file"
      />
    </label>
  );
}
