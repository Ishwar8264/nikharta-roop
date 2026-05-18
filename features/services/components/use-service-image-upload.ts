/**
 * Purpose: Client hook that connects service forms to the reusable media uploader.
 * Responsibilities: upload service images, load media library items, and track the selected image URL.
 * Important notes: the selected URL is submitted through a hidden input because the API stores imageUrl.
 */
"use client";

import * as React from "react";

import type { MediaUploaderItem } from "@/features/media/types/media-uploader.types";
import { mergeMediaItems } from "@/features/media/helpers/media-uploader-items";
import {
  createServiceImageUploadSignatureAction,
  listServiceImageUploadsAction,
} from "@/features/services/actions/service-media.actions";
import {
  createServiceImageFileHash,
  uploadServiceImageToCloudinary,
  validateServiceImageFile,
} from "@/features/services/helpers/service-media-upload.client";

/**
 * Provides upload, library loading, and selected image state for service forms.
 */
export function useServiceImageUpload(
  initialUrl: string | null,
  onImageUrlChange: (imageUrl: string) => void,
) {
  const [previewUrl, setPreviewUrl] = React.useState(initialUrl);
  const [items, setItems] = React.useState(() => getInitialServiceItems(initialUrl));

  /**
   * Uploads a file with a server-signed Cloudinary contract.
   */
  async function uploadServiceImage(file: File): Promise<MediaUploaderItem> {
    const fileHash = await createServiceImageFileHash(file);
    const signature = await createServiceImageUploadSignatureAction(fileHash);

    if (!signature.success) throw new Error(signature.message);

    validateServiceImageFile(file, signature.uploadTypes, signature.maxBytes);
    const result = await uploadServiceImageToCloudinary(file, signature);

    return {
      id: result.imageUrl,
      name: file.name,
      url: result.imageUrl,
    };
  }

  /**
   * Updates both preview state and the hidden form value.
   */
  function selectServiceImage(item: MediaUploaderItem) {
    setPreviewUrl(item.url);
    onImageUrlChange(item.url);
  }

  /**
   * Loads existing service media lazily when the dialog opens.
   */
  async function loadServiceImageItems() {
    const result = await listServiceImageUploadsAction();

    if (result.success) {
      setItems((currentItems) => mergeMediaItems(result.items, currentItems));
    }
  }

  return {
    initialItems: items,
    loadServiceImageItems,
    previewUrl,
    selectServiceImage,
    uploadServiceImage,
  };
}

/**
 * Seeds the picker with an existing value when editing is added later.
 */
function getInitialServiceItems(imageUrl: string | null): MediaUploaderItem[] {
  if (!imageUrl) return [];

  return [{
    id: imageUrl,
    name: "Selected service image",
    url: imageUrl,
  }];
}
