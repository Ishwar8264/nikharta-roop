"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";

const MARKER_ICON = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LeafletMapPreviewProps {
  latitude: number;
  longitude: number;
  name: string;
}

/** Renders the Leaflet preview after the browser-only boundary loads. */
export default function LeafletMapPreview({
  latitude,
  longitude,
  name,
}: LeafletMapPreviewProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      className="h-72 w-full rounded-xl"
      aria-label={`Map showing ${name}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={MARKER_ICON} />
    </MapContainer>
  );
}
