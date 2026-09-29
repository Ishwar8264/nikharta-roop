"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { FilterChips, SearchInput } from "@/components/shared";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

import { ClearButton } from "@/components/shared/clear-button";
import { SALON_CATEGORY_OPTIONS } from "../constants";
import type { SalonCategory, SalonFilters } from "../types";

interface FilterBarProps {
  initial: SalonFilters;
}

/** Delay before a keystroke commits to the URL. */
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Salon listing filters.
 *
 * Why debounce into the URL:
 * Each keystroke fires a server navigation. Without debounce that is one
 * full RSC round-trip per character. 400ms is long enough to skip over a
 * normal typing burst, short enough to feel instant.
 *
 * Why useTransition:
 * router.replace is async but does not return a promise. startTransition
 * lets us observe its in-flight state via isPending, which drives the
 * spinner inside SearchInput. No manual loading flag needed.
 */
export function FilterBar({ initial }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initial.search ?? "");
  const [isPending, startTransition] = useTransition();

  function applyFilters(next: Partial<SalonFilters>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, String(value));
    }

    // Any filter change invalidates the cursor — the previous page's "next"
    // no longer corresponds to the new filter set.
    params.delete("cursor");

    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const debouncedApplySearch = useDebouncedCallback((value: string) => {
    startTransition(() => {
      applyFilters({ search: value || undefined });
    });
  }, SEARCH_DEBOUNCE_MS);

  function handleSearchChange(value: string) {
    setSearch(value);
    debouncedApplySearch(value);
  }

  function clearAll() {
    setSearch("");
    router.replace("?", { scroll: false });
  }

  const hasFilters = Boolean(
    initial.city || initial.category || initial.search,
  );

  return (
    <div className=" flex items-center gap-3">
      <div className="flex-1">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search salons by name…"
          aria-label="Search salons"
          isLoading={isPending}
          submitLabel={null}
          variant="default"
        />
      </div>
      <FilterChips<SalonCategory>
        options={SALON_CATEGORY_OPTIONS}
        value={initial.category}
        onChange={(v) => applyFilters({ category: v ?? undefined })}
        aria-label="Filter by category"
        display="dropdown"
        dropdownLabel="Category"
      />

      {hasFilters ? (
        <ClearButton
          onClick={clearAll}
          label="Clear filters"
          variant="destructive"
          size="md"
          aria-label="Clear all filters"
          className="rounded-md"
        />
      ) : null}
    </div>
  );
}
