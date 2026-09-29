"use client";

import { useState } from "react";

import type { UploadedImage } from "@/features/media";
import { ImageUploader } from "@/features/media";

export default function MediaPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-heading text-2xl font-bold">Upload Images</h1>
      <div className="mt-6">
        <ImageUploader
          value={images}
          onChange={setImages}
          maxFiles={10}
          maxSizeMB={5}
        />
      </div>

      {/* Debug: URLs dikhane ke liye */}
      <pre className="mt-6 overflow-auto rounded bg-muted p-4 text-xs">
        {JSON.stringify(
          images.map((i) => i.url),
          null,
          2,
        )}
      </pre>
    </main>
  );
}
