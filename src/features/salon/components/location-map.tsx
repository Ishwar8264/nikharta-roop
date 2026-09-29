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

/**
 * Leaflet's default marker icon URLs break under bundlers — the icon is
 * resolved relative to the JS file at runtime and ends up 404ing. Pointing
 * the URLs at unpkg's CDN pins them to a known version and sidesteps the
 * whole asset-loader problem without shipping the images ourselves.
 */
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

/**
 * Draggable-pin map. Click anywhere or drag the marker to set coordinates.
 *
 * Why a separate component from LocationPicker:
 * react-leaflet touches `window` at import time. Isolating it here lets the
 * parent statically render the search bar and inputs while only this piece
 * defers to the client via next/dynamic.
 */
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

/** Converts any map click into a coordinate change. */
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

/**
 * Keeps the map viewport in sync when the parent changes coordinates via
 * search or geolocation. Without this the marker moves but the viewport
 * stays where the user last scrolled.
 */
function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}
