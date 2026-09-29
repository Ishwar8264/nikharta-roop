import Image from "next/image";

interface SalonGalleryProps {
  images: string[];
  name: string;
}

export function SalonGallery({ images, name }: SalonGalleryProps) {
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
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
