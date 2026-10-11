"use client";

import { ChevronDown, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/lib/api/backend.client";
import { appointmentPriceFormatter } from "@/features/appointment/format";
import { formatDuration } from "./schemas";
import type { PackageServiceOption } from "./types";

type OptionsResponse = { data: PackageServiceOption[]; meta: { hasMore: boolean; nextCursor: string | null } };

/** Searches on the server while keeping selected services independent of the result page. */
export function PackageServiceSelect({ salonId, selected, onToggle, onCancel, onOptions, disabled, error }: {
  salonId: string;
  selected: Array<{ id: string; name: string }>;
  onToggle: (id: string) => void;
  onCancel: (ids: string[]) => void;
  onOptions: (items: PackageServiceOption[]) => void;
  disabled?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PackageServiceOption[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const previousSelection = useRef<string[]>([]);
  const generation = useRef(0);
  const optionsCallback = useRef(onOptions);
  useEffect(() => { optionsCallback.current = onOptions; }, [onOptions]);

  useEffect(() => {
    if (!open) return;
    const version = ++generation.current;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setBusy(true);
      setMessage(null);
      setItems([]);
      setCursor(null);
      try {
        const params = new URLSearchParams({ search: query.trim() });
        const result = await api.get<OptionsResponse>(`/salons/${encodeURIComponent(salonId)}/service-options?${params}`, { signal: controller.signal });
        if (version !== generation.current || controller.signal.aborted) return;
        setItems(result.data);
        setCursor(result.meta.nextCursor);
        optionsCallback.current(result.data);
      } catch (caught) {
        if (!controller.signal.aborted) setMessage(caught instanceof Error ? caught.message : "Unable to load services");
      } finally {
        if (!controller.signal.aborted && version === generation.current) setBusy(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); generation.current = version + 1; };
  }, [open, query, salonId, retry]);

  async function loadMore() {
    if (!cursor || busy) return;
    const version = generation.current;
    setBusy(true);
    setMessage(null);
    try {
      const params = new URLSearchParams({ search: query.trim(), cursor });
      const result = await api.get<OptionsResponse>(`/salons/${encodeURIComponent(salonId)}/service-options?${params}`);
      if (version !== generation.current) return;
      setItems((previous) => [...previous, ...result.data.filter((item) => !previous.some((existing) => existing.id === item.id))]);
      setCursor(result.meta.nextCursor);
      optionsCallback.current(result.data);
    } catch (caught) {
      if (version === generation.current) setMessage(caught instanceof Error ? caught.message : "Unable to load services");
    } finally {
      if (version === generation.current) setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={(next) => {
        if (next) previousSelection.current = selected.map((service) => service.id);
        setOpen(next);
      }}>
        <PopoverTrigger variant="outline" disabled={disabled} aria-label="Select included services" className="h-11 w-full justify-between rounded-md border-input bg-transparent px-2.5 text-sm font-normal dark:bg-input/30" aria-invalid={Boolean(error)}>
          <span>{selected.length ? `${selected.length} services selected` : "Select services"}</span>
          <ChevronDown className="size-4" aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--trigger-width) min-w-64 max-w-[calc(100vw-2rem)]" aria-label="Included services">
          <SearchInput aria-label="Search services" placeholder="Search services…" value={query} maxLength={80} onChange={setQuery} size="sm" isLoading={busy} submitLabel={null} />
          <Separator />
          <div className="max-h-64 space-y-1 overflow-y-auto overscroll-contain" aria-busy={busy}>
            {items.map((service) => {
              const checked = selected.some((item) => item.id === service.id);
              return <Checkbox key={service.id} isSelected={checked} isDisabled={disabled || (!checked && selected.length >= 30)} onChange={() => onToggle(service.id)}>
                <span className="min-w-0"><span className="block text-sm font-medium">{service.name}</span><span className="block text-xs text-muted-foreground">{service.category?.name ? `${service.category.name} · ` : ""}{appointmentPriceFormatter.format(service.price)} · {formatDuration(service.duration)}</span></span>
              </Checkbox>;
            })}
            {busy ? <div role="status" className="flex justify-center gap-2 p-3 text-xs"><Loader2 className="size-4 animate-spin" />Loading services…</div> : null}
            {!busy && !message && !items.length ? <p className="p-3 text-sm text-muted-foreground">{query ? "No services match your search." : "No published services available."}</p> : null}
            {message ? <div role="alert" className="p-2 text-xs text-destructive">{message}<Button type="button" variant="ghost" size="sm" onClick={() => setRetry((value) => value + 1)}>Retry</Button></div> : null}
            {cursor && !busy ? <Button type="button" variant="ghost" className="w-full" onClick={loadMore}>Load more</Button> : null}
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3 px-2">
            <p className="text-xs text-muted-foreground">{selected.length} selected · Up to 30 services</p>
            {selected.length > 0 ? (
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => {
                  onCancel(previousSelection.current);
                  setOpen(false);
                }}>Cancel</Button>
                <Button type="button" size="sm" onClick={() => setOpen(false)}>Done</Button>
              </div>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      {selected.length ? <div className="flex flex-wrap gap-2">{selected.map((service) => <Button key={service.id} type="button" variant="secondary" size="sm" disabled={disabled} aria-label={`Remove ${service.name}`} onClick={() => onToggle(service.id)}>{service.name}<X className="size-3" aria-hidden="true" /></Button>)}</div> : null}
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
