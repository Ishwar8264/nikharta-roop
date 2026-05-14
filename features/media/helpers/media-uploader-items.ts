import type { MediaUploaderItem } from "@/features/media/types/media-uploader.types";

// Dedupes media by URL so repeated uploads do not create duplicate UI entries.
export function mergeMediaItems(
  incomingItems: MediaUploaderItem[],
  currentItems: MediaUploaderItem[],
) {
  const mediaByUrl = new Map<string, MediaUploaderItem>();

  [...incomingItems, ...currentItems].forEach((item) => {
    mediaByUrl.set(item.url, item);
  });

  return Array.from(mediaByUrl.values());
}
