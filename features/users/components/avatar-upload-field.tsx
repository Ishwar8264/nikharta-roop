"use client";

import * as React from "react";
import { ImageUp } from "lucide-react";

import { createAvatarUploadSignatureAction } from "@/features/users/actions/avatar-upload.actions";
import { uploadAvatarToCloudinary } from "@/features/users/helpers/avatar-upload.client";

type AvatarUploadFieldProps = {
  onUploaded: (avatarUrl: string) => void;
};

// Handles direct-to-Cloudinary upload before the profile save action runs.
export function AvatarUploadField({ onUploaded }: AvatarUploadFieldProps) {
  const [message, setMessage] = React.useState("");
  const [isUploading, startUploadTransition] = React.useTransition();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) return;

    startUploadTransition(async () => {
      try {
        const signature = await createAvatarUploadSignatureAction();

        if (!signature.success) {
          setMessage(signature.message);
          return;
        }

        validateAvatarFile(file, signature.uploadTypes, signature.maxBytes);
        const result = await uploadAvatarToCloudinary(file, signature);

        onUploaded(result.avatarUrl);
        setMessage("Upload complete. Save avatar to update profile.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Upload failed.");
      }
    });
  }

  return (
    <label className="block space-y-1.5 text-sm font-medium">
      Upload Image
      <span className="flex h-11 items-center gap-2 rounded-xl border border-input bg-white px-3 text-sm text-muted-foreground">
        <ImageUp className="size-4" />
        <input
          accept="image/jpeg,image/png,image/webp"
          className="w-full text-sm"
          disabled={isUploading}
          onChange={handleFileChange}
          type="file"
        />
      </span>
      {message ? <span className="block text-muted-foreground">{message}</span> : null}
    </label>
  );
}

function validateAvatarFile(file: File, allowedTypes: string[], maxBytes: number) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Upload JPG, PNG, or WebP image only.");
  }

  if (file.size > maxBytes) {
    throw new Error("Avatar image must be 2MB or smaller.");
  }
}
