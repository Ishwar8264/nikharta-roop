"use client";

import { Grid3x3, ImageIcon, List, Loader2, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { listMedia } from "../actions";
import type { MediaAsset, UploadedImage } from "../types";
import { MediaCard } from "./media-card";

type ViewMode = "grid" | "list";

interface GalleryPaneProps {
  value: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  mode: "single" | "multiple";
  max: number;
  disabled?: boolean;
}

/**
 * Gallery tab — browse and select from the user's library.
 *
 * Why local search:
 * After the first fetch the list is in memory. Client-side filtering is
 * instant and needs no round trip.
 *
 * Why the fetch lives in an effect with an AbortController:
 * The request is external I/O, which is what effects exist for. The
 * controller prevents a late response from a mounted-then-unmounted
 * component from writing state onto a dead tree — a real risk when the
 * user closes the dialog before the fetch resolves.
 *
 * Why no setIsLoading(true) in the effect:
 * Initial state already is `true`. Setting it again on mount would be a
 * synchronous setState inside the effect body, which React 19 flags as a
 * cascading render.
 */
export function GalleryPane({
  value,
  onChange,
  mode,
  max,
  disabled,
}: GalleryPaneProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  const selectedIds = new Set(value.map((v) => v.publicId));

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const result = await listMedia({ limit: 60 });
        if (controller.signal.aborted) return;
        setAssets(result.items);
        setError(null);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Could not load library");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  function toggle(asset: MediaAsset) {
    const isSelected = selectedIds.has(asset.publicId);
    const asUploaded: UploadedImage = {
      url: asset.url,
      publicId: asset.publicId,
      width: asset.width ?? undefined,
      height: asset.height ?? undefined,
      format: asset.format ?? undefined,
      bytes: asset.bytes ?? undefined,
    };

    if (mode === "single") {
      onChange(isSelected ? [] : [asUploaded]);
      return;
    }

    if (isSelected) {
      onChange(value.filter((v) => v.publicId !== asset.publicId));
      return;
    }

    if (value.length >= max) return;
    onChange([...value, asUploaded]);
  }

  const filtered = query.trim()
    ? assets.filter((a) =>
        a.publicId.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : assets;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search media…"
            className="h-9 pl-8 text-sm"
          />
        </div>

        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          <ViewToggle
            active={view === "grid"}
            onClick={() => setView("grid")}
            icon={Grid3x3}
            label="Grid view"
          />
          <ViewToggle
            active={view === "list"}
            onClick={() => setView("list")}
            icon={List}
            label="List view"
          />
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2
            className="h-5 w-5 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-16 text-center">
          <ImageIcon
            className="h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            {query ? "No images match your search." : "Your library is empty."}
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((asset) => (
            <MediaCard
              key={asset.id}
              asset={asset}
              selected={selectedIds.has(asset.publicId)}
              onToggle={() => toggle(asset)}
              disabled={disabled}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((asset) => (
            <ListRow
              key={asset.id}
              asset={asset}
              selected={selectedIds.has(asset.publicId)}
              onToggle={() => toggle(asset)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Grid3x3;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}

function ListRow({
  asset,
  selected,
  onToggle,
  disabled,
}: {
  asset: MediaAsset;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const filename = asset.publicId.split("/").pop() ?? "image";
  const date = new Date(asset.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40",
      )}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
        <Image
          src={asset.url}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {filename}
        </p>
        <p className="text-xs text-muted-foreground">
          {asset.format?.toUpperCase() ?? "IMG"} · {date}
        </p>
      </div>
    </button>
  );
}
