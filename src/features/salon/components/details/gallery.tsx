import Image from "next/image";

interface SalonGalleryProps {
  images: string[];
  name: string;
  /** Load the hero image eagerly when it also appears in the gallery. */
  eagerImageSrc?: string;
}

export function SalonGallery({ images, name, eagerImageSrc }: SalonGalleryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((url, index) => (
        <div
          key={`${url}-${index}`}
          className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
        >
          <Image
            src={url}
            alt={`${name} — photo ${index + 1}`}
            fill
            loading={url === eagerImageSrc ? "eager" : "lazy"}
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
