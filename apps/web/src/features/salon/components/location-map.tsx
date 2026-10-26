"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useEffectEvent, useRef } from "react";

const MARKER_ICON = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  onChange: (next: { latitude: number; longitude: number }) => void;
  zoom?: number;
  className?: string;
}

/** Own the map and its DOM together so effect replay cannot reuse a removed map. */
export default function LocationMap({ latitude, longitude, onChange, zoom = 15, className }: LocationMapProps) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<{ map: L.Map; marker: L.Marker } | null>(null);
  const reportPosition = useEffectEvent((point: L.LatLng) => {
    onChange({ latitude: point.lat, longitude: point.lng });
  });

  useEffect(() => {
    if (!host.current) return;
    // A fresh child handles React Activity restoring the same host element.
    const container = document.createElement("div");
    container.style.height = "100%";
    host.current.appendChild(container);
    const map = L.map(container);
    const marker = L.marker([0, 0], { icon: MARKER_ICON, draggable: true }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.on("click", (event: L.LeafletMouseEvent) => reportPosition(event.latlng));
    marker.on("dragend", () => reportPosition(marker.getLatLng()));
    instance.current = { map, marker };
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => {
      observer.disconnect();
      instance.current = null;
      map.remove();
      container.remove();
    };
  }, []);

  useEffect(() => {
    const current = instance.current;
    if (!current) return;
    current.map.setView([latitude, longitude], zoom);
    current.marker.setLatLng([latitude, longitude]);
  }, [latitude, longitude, zoom]);

  return <div ref={host} className={className ?? "h-72 w-full rounded-lg"} />;
}
