"use client";

import * as React from "react";
import { Images, UploadCloud } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaLibraryList } from "@/features/media/components/media-library-list";
import { MediaUploadProgress } from "@/features/media/components/media-upload-progress";
import { MediaUploadDropzone } from "@/features/media/components/media-upload-dropzone";
import { mergeMediaItems } from "@/features/media/helpers/media-uploader-items";
import type { MediaUploaderProps } from "@/features/media/types/media-uploader.types";

// Reusable upload + library picker for avatars and future media modules.
export function MediaUploader({
  accept = "image/*",
  helperText,
  initialItems = [],
  onSelect,
  onSelectComplete,
  onUploadComplete,
  onUpload,
  selectedUrl,
}: MediaUploaderProps) {
  const [uploadedItems, setUploadedItems] = React.useState<typeof initialItems>([]);
  const [message, setMessage] = React.useState("");
  const [isUploading, startUploadTransition] = React.useTransition();
  // Merge remote library items with just-uploaded items without showing duplicates.
  const items = React.useMemo(
    () => mergeMediaItems(uploadedItems, initialItems),
    [initialItems, uploadedItems],
  );

  // Upload stays inside a transition so the dialog remains responsive.
  function handleFile(file: File) {
    startUploadTransition(async () => {
      try {
        const item = await onUpload(file);

        setUploadedItems((currentItems) => mergeMediaItems([item], currentItems));
        onSelect?.(item);
        onUploadComplete?.(item);
        setMessage("Upload complete.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Upload failed.");
      }
    });
  }

  // Library selection is separate from upload completion so dialogs can close faster.
  function handleLibrarySelect(item: (typeof items)[number]) {
    onSelect?.(item);
    onSelectComplete?.(item);
  }

  return (
    <Tabs defaultValue="upload" className="gap-4">
      <TabsList className="grid h-9 w-full grid-cols-2">
        <TabsTrigger className="w-full" value="upload">
          <UploadCloud className="size-4" />
          Upload
        </TabsTrigger>
        <TabsTrigger className="w-full" value="library">
          <Images className="size-4" />
          Library
        </TabsTrigger>
      </TabsList>

      <div className="rounded-xl border bg-white/75 p-4">
        <TabsContent className="mt-0 space-y-4" value="upload">
          <MediaUploadDropzone
            accept={accept}
            disabled={isUploading}
            helperText={helperText}
            onFileChange={handleFile}
          />
          <MediaUploadProgress isUploading={isUploading} message={message} />
        </TabsContent>

        <TabsContent className="mt-0" value="library">
          <MediaLibraryList
            items={items}
            onSelect={handleLibrarySelect}
            selectedUrl={selectedUrl}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
