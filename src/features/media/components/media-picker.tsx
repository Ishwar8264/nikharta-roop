"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import type { UploadedImage } from "../types";
import { GalleryPane } from "./gallery-pane";
import { UploadPane } from "./upload-pane";

interface MediaPickerProps {
  value: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  mode?: "single" | "multiple";
  max?: number;
  defaultTab?: "upload" | "library";
  maxSizeMB?: number;
  accept?: string[];
  disabled?: boolean;
  className?: string;
}

export function MediaPicker({
  value,
  onChange,
  mode = "multiple",
  max = 10,
  defaultTab = "upload",
  maxSizeMB = 5,
  accept,
  disabled,
  className,
}: MediaPickerProps) {
  return (
    <Tabs defaultValue={defaultTab} className={cn("w-full", className)}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upload">Upload New</TabsTrigger>
        <TabsTrigger value="library">Select from Gallery</TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-4">
        <UploadPane
          value={value}
          onChange={onChange}
          maxFiles={max}
          maxSizeMB={maxSizeMB}
          accept={accept}
          disabled={disabled}
        />
      </TabsContent>

      <TabsContent value="library" className="mt-4">
        <GalleryPane
          value={value}
          onChange={onChange}
          mode={mode}
          max={max}
          disabled={disabled}
        />
      </TabsContent>
    </Tabs>
  );
}
