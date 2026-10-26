"use client";

import dynamic from "next/dynamic";

const LeafletMapPreview = dynamic(() => import("./map-preview.client"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-72 w-full items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground"
      role="status"
    >
      Loading map…
    </div>
  ),
});

interface SalonMapPreviewProps {
  latitude: number;
  longitude: number;
  name: string;
}

/**
 * Exposes the salon map through a browser-only Leaflet boundary.
 *
 * Why:
 * Leaflet reads `window` while its module is evaluated. A client component
 * can still be pre-rendered by Next.js, so the complete Leaflet module—not
 * only its child components—must live behind `ssr: false`.
 */
export function SalonMapPreview(props: SalonMapPreviewProps) {
  return <LeafletMapPreview {...props} />;
}
