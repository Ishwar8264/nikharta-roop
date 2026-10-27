"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATALOG_STATUSES, CATALOG_STATUS_LABELS, type CatalogStatus } from "@nikharta-roop/shared/constants/catalog-status";

/** Shared publication control for salon catalogue items. */
export function CatalogStatusField({ value, onChange, onBlur, disabled }: {
  value?: CatalogStatus;
  onChange: (value: CatalogStatus) => void;
  onBlur?: () => void;
  disabled?: boolean;
}) {
  return <div className="space-y-2 rounded-xl border p-4">
    <Label id="catalog-status-label" htmlFor="catalog-status">Status</Label>
    <Select aria-labelledby="catalog-status-label" value={value ?? "DRAFT"} onValueChange={(next) => { if (CATALOG_STATUSES.includes(next as CatalogStatus)) onChange(next as CatalogStatus); }}>
      <SelectTrigger id="catalog-status" className="w-full" onBlur={onBlur} disabled={disabled}><SelectValue /></SelectTrigger>
      <SelectContent>{CATALOG_STATUSES.map((status) => <SelectItem key={status} value={status}>{CATALOG_STATUS_LABELS[status]}</SelectItem>)}</SelectContent>
    </Select>
    <p className="text-xs text-muted-foreground">{value === "PUBLISHED" ? "Visible to customers and available online." : value === "PAUSED" ? "Temporarily hidden. Publish again when ready." : value === "ARCHIVED" ? "Retired from your public catalogue. You can restore it later." : "Only visible in management until you publish it."}</p>
  </div>;
}
