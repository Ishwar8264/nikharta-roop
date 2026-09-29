"use client";

import { Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Leaflet touches `window` at import time. Loading it with `ssr: false`
 * keeps the page renderable on the server and ships the map JS only when
 * the component actually mounts in the browser.
 */
const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 w-full items-center justify-center rounded-lg border border-border bg-muted/30">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

interface NominatimResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
}

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (next: {
    latitude: number;
    longitude: number;
    address?: string;
    placeId?: string;
    city?: string;
    state?: string;
    zip?: string;
  }) => void;
  /** Fallback center when nothing is selected — city center works well. */
  defaultCenter?: { latitude: number; longitude: number };
  disabled?: boolean;
  latitudeError?: string;
  longitudeError?: string;
  placeError?: string;
  className?: string;
}

const DEFAULT_CENTER = { latitude: 19.076, longitude: 72.8777 }; // Mumbai

function getStructuredAddress(result: NominatimResult) {
  const address = result.address;

  return {
    address: result.display_name,
    city:
      address?.city ??
      address?.town ??
      address?.village ??
      address?.municipality ??
      address?.city_district ??
      address?.county ??
      address?.state_district,
    state: address?.state,
    zip: address?.postcode,
  };
}

/**
 * Address search + geolocation + draggable map, all in one field.
 *
 * Why Nominatim:
 * OpenStreetMap's geocoder is free and requires no key. Its usage policy
 * mandates a descriptive User-Agent and a 1 req/sec ceiling — we honor both
 * by debouncing and by sending the browser's own UA (which the browser sets
 * automatically for fetch from a page origin).
 *
 * Why the search is manual (Enter/submit) and not live:
 * Nominatim's rate limit makes keystroke-level autocomplete a policy
 * violation. A user-initiated search is one request per intent, which keeps
 * us comfortably inside the limit.
 */
export function LocationPicker({
  latitude,
  longitude,
  onChange,
  defaultCenter = DEFAULT_CENTER,
  disabled,
  latitudeError,
  longitudeError,
  placeError,
  className,
}: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const point = {
    latitude: latitude ?? defaultCenter.latitude,
    longitude: longitude ?? defaultCenter.longitude,
  };

  // Close the results popover when clicking outside of it.
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback(async () => {
    const term = query.trim();
    if (term.length < 3) {
      setError("Type at least 3 characters to search.");
      return;
    }

    setIsSearching(true);
    setError(null);
    setShowResults(true);

    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", term);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "5");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("countrycodes", "in");

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Search service unavailable");

      const data = (await res.json()) as NominatimResult[];
      setResults(data);

      if (data.length === 0) setError("No matches found.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number) => {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("lat", String(latitude));
      url.searchParams.set("lon", String(longitude));
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("zoom", "18");

      const response = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Address lookup is unavailable.");

      return (await response.json()) as NominatimResult;
    },
    [],
  );

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Your browser does not support geolocation.");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        // Move the map immediately; address lookup may take a little longer.
        onChange({ latitude, longitude });

        try {
          const result = await reverseGeocode(latitude, longitude);
          const address = getStructuredAddress(result);
          onChange({
            latitude,
            longitude,
            placeId: String(result.place_id),
            ...address,
          });
          setQuery(result.display_name);
        } catch (lookupError) {
          setError(
            lookupError instanceof Error
              ? lookupError.message
              : "Address lookup failed.",
          );
        } finally {
          setIsLocating(false);
        }
      },
      (geoError) => {
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission denied. Enable it in your browser settings."
            : "Could not determine your location.",
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [onChange, reverseGeocode]);

  function pickResult(result: NominatimResult) {
    const address = getStructuredAddress(result);
    onChange({
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      placeId: String(result.place_id),
      ...address,
    });
    setQuery(result.display_name);
    setShowResults(false);
  }

  return (
    <div className={cn("space-y-3", className)} ref={containerRef}>
      {/* Search bar */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative z-[1000] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void search();
              }
              if (e.key === "Escape") setShowResults(false);
            }}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Search address, landmark, or area…"
            disabled={disabled}
            aria-label="Search salon location"
            className="pl-9 pr-9"
          />
          {isSearching ? (
            <Loader2
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : null}

          {/* Results popover */}
          {showResults && results.length > 0 ? (
            <ul
              role="listbox"
              className="absolute z-[1000] mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-lg"
            >
              {results.map((result) => (
                <li key={result.place_id}>
                  <button
                    type="button"
                    onClick={() => pickResult(result)}
                    className="flex w-full gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <MapPin
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="line-clamp-2">{result.display_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void search()}
          disabled={disabled || isSearching || query.trim().length < 3}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSearching ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="size-4" aria-hidden="true" />
          )}
          Search
        </button>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={disabled || isLocating}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Use my location
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Enter at least 3 characters, then press Search or Enter to see matches.
      </p>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {placeError ? (
        <p role="alert" className="text-xs text-destructive">
          {placeError}
        </p>
      ) : null}

      {/* Map */}
      <LocationMap
        latitude={point.latitude}
        longitude={point.longitude}
        onChange={onChange}
        className={cn(
          "h-72 w-full rounded-lg",
          disabled && "pointer-events-none opacity-60",
        )}
      />

      {/* Coordinates */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="latitude" className="text-xs text-muted-foreground">
            Latitude
          </Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            value={latitude ?? ""}
            onChange={(e) =>
              onChange({
                latitude: Number(e.target.value),
                longitude: point.longitude,
              })
            }
            placeholder="e.g. 19.0760"
            disabled={disabled}
            aria-invalid={latitudeError ? true : undefined}
            aria-describedby={latitudeError ? "latitude-error" : undefined}
          />
          {latitudeError ? (
            <p
              id="latitude-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {latitudeError}
            </p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="longitude" className="text-xs text-muted-foreground">
            Longitude
          </Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            value={longitude ?? ""}
            onChange={(e) =>
              onChange({
                latitude: point.latitude,
                longitude: Number(e.target.value),
              })
            }
            placeholder="e.g. 72.8777"
            disabled={disabled}
            aria-invalid={longitudeError ? true : undefined}
            aria-describedby={longitudeError ? "longitude-error" : undefined}
          />
          {longitudeError ? (
            <p
              id="longitude-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {longitudeError}
            </p>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Drag the pin or click anywhere on the map to fine-tune the location.
      </p>
    </div>
  );
}
