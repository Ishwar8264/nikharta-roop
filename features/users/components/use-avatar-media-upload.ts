"use client";

import * as React from "react";

import type { MediaUploaderItem } from "@/features/media/types/media-uploader.types";
import { mergeMediaItems } from "@/features/media/helpers/media-uploader-items";
import {
  createAvatarUploadSignatureAction,
  listAvatarUploadsAction,
} from "@/features/users/actions/avatar-upload.actions";
import {
  createAvatarFileHash,
  uploadAvatarToCloudinary,
  validateAvatarFile,
} from "@/features/users/helpers/avatar-upload.client";
import type { UserProfile } from "@/features/users/types/user-profile.types";

// Connects the generic media uploader to the avatar Cloudinary flow.
export function useAvatarMediaUpload(
  user: UserProfile,
  onAvatarUrlChange: (avatarUrl: string) => void,
) {
  const [previewUrl, setPreviewUrl] = React.useState(user.avatarUrl);
  const [items, setItems] = React.useState(() => getInitialAvatarItems(user));

  // Create a signed Cloudinary upload from the file content, then return picker data.
  async function uploadAvatar(file: File): Promise<MediaUploaderItem> {
    const fileHash = await createAvatarFileHash(file);
    const signature = await createAvatarUploadSignatureAction(fileHash);

    if (!signature.success) throw new Error(signature.message);

    validateAvatarFile(file, signature.uploadTypes, signature.maxBytes);
    const result = await uploadAvatarToCloudinary(file, signature);

    return {
      id: result.avatarUrl,
      name: file.name,
      url: result.avatarUrl,
    };
  }

  // Selection updates both the visible preview and the hidden form value.
  function selectAvatar(item: MediaUploaderItem) {
    setPreviewUrl(item.url);
    onAvatarUrlChange(item.url);
  }

  // Load Cloudinary assets lazily so the account page stays light on first paint.
  async function loadAvatarItems() {
    const result = await listAvatarUploadsAction();

    if (result.success) {
      setItems((currentItems) => mergeMediaItems(result.items, currentItems));
    }
  }

  return {
    initialItems: items,
    loadAvatarItems,
    previewUrl,
    selectAvatar,
    uploadAvatar,
  };
}

// Seed the library with the currently saved avatar before remote media loads.
function getInitialAvatarItems(user: UserProfile): MediaUploaderItem[] {
  if (!user.avatarUrl) return [];

  return [{
    id: user.avatarUrl,
    name: "Current avatar",
    url: user.avatarUrl,
  }];
}
