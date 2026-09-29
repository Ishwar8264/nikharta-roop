"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

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

interface LocationMapProps {
  latitude: number;
  longitude: number;
  onChange: (next: { latitude: number; longitude: number }) => void;
  zoom?: number;
  className?: string;
}

export default function LocationMap({
  latitude,
  longitude,
  onChange,
  zoom = 15,
  className,
}: LocationMapProps) {
  const center = useMemo<[number, number]>(
    () => [latitude, longitude],
    [latitude, longitude],
  );

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      className={className ?? "h-72 w-full rounded-lg"}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickCatcher onChange={onChange} />
      <Recenter center={center} />
      <MapResizer />

      <Marker
        position={center}
        icon={MARKER_ICON}
        draggable
        eventHandlers={{
          dragend: (event) => {
            const marker = event.target as L.Marker;
            const { lat, lng } = marker.getLatLng();
            onChange({ latitude: lat, longitude: lng });
          },
        }}
      />
    </MapContainer>
  );
}

function ClickCatcher({
  onChange,
}: {
  onChange: (next: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });
  return null;
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

/**
 * Fixes Leaflet's layout-shift bug: the map caches its container size at
 * mount and never re-measures when the parent grows/shrinks. Watching the
 * container with a ResizeObserver keeps the tiles aligned with the box.
 */
function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}
