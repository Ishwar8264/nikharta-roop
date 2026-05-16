"use client";

import * as React from "react";
import { ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MediaUploader } from "@/features/media/components/media-uploader";
import type { MediaUploaderProps } from "@/features/media/types/media-uploader.types";

type MediaUploaderDialogProps = MediaUploaderProps & {
  buttonLabel?: string;
  description?: string;
  title?: string;
};

// Opens the reusable media uploader from a compact field/button.
export function MediaUploaderDialog({
  buttonLabel = "Choose media",
  description = "Upload a new file or select from the uploaded list.",
  title = "Media uploader",
  ...uploaderProps
}: MediaUploaderDialogProps) {
  const [open, setOpen] = React.useState(false);

  // Opening the dialog is the best time to refresh remote media lists.
  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      uploaderProps.onOpen?.();
    }
  }

  return (
    <Dialog modal open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <ImagePlus className="size-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-3xl"
        // Keep upload progress safe from accidental outside clicks.
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <MediaUploader
          {...uploaderProps}
          onSelectComplete={(item) => {
            uploaderProps.onSelectComplete?.(item);
            // A tiny delay lets the selected state paint before closing.
            window.setTimeout(() => setOpen(false), 150);
          }}
          onUploadComplete={(item) => {
            uploaderProps.onUploadComplete?.(item);
            window.setTimeout(() => setOpen(false), 350);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
