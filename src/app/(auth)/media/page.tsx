"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { UploadedImage } from "@/features/media";
import { MediaPicker, MediaPickerDialog } from "@/features/media";

export default function MediaTestPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dialogImages, setDialogImages] = useState<UploadedImage[]>([]);

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <header>
        <h1 className="font-heading text-2xl font-bold">Media Picker Test</h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Inline</h2>
        <MediaPicker
          value={images}
          onChange={setImages}
          mode="multiple"
          max={10}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Dialog</h2>
        <MediaPickerDialog
          title="Add Media to Event"
          value={dialogImages}
          onChange={setDialogImages}
          max={10}
          trigger={<Button variant="outline">Open Media Picker</Button>}
        />
      </section>

      <pre className="overflow-auto rounded border border-border bg-muted/30 p-4 text-xs">
        {JSON.stringify(images, null, 2)}
      </pre>
    </main>
  );
}
