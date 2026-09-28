"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { SALON_CATEGORIES, type SalonFilters } from "../types";

interface FilterBarProps {
  initial: SalonFilters;
}

/**
 * Filter bar — the client island of the listing page.
 *
 * Why URL-driven:
 * Filters belong in the URL, not in React state. That gives shareable
 * links, bookmarking, back-button support, and server-side rendering of
 * filtered results — none of which a useState-based filter provides.
 *
 * Why router.replace, not router.push:
 * Each keystroke that changes a filter should not stack a history entry.
 * The user should be able to hit Back and leave the listing entirely,
 * not step through 12 intermediate query strings.
 */
export function FilterBar({ initial }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initial.search ?? "");

  /**
   * Why `scroll: false`:
   * The listing grid is below the filter bar. Re-rendering the page after
   * a filter change should NOT jump the user to the top — they need to
   * see the results immediately below the controls they just used.
   */
  function applyFilters(next: Partial<SalonFilters>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, String(value));
    }

    // Any filter change invalidates the cursor — the previous page's
    // "next" no longer corresponds to the new filter set.
    params.delete("cursor");

    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function clearAll() {
    setSearch("");
    router.replace("?", { scroll: false });
  }

  const hasFilters = Boolean(
    initial.city || initial.category || initial.search,
  );

  return (
    <div className="space-y-4">
      {/* ─── Search ─── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters({ search: search.trim() || undefined });
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search salons by name…"
            className="pl-9"
            aria-label="Search salons"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* ─── Category chips ─── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => applyFilters({ category: undefined })}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            !initial.category
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          All
        </button>

        {SALON_CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => applyFilters({ category: value })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              initial.category === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}

        {hasFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Clear all
          </button>
        ) : null}
      </div>
    </div>
  );
}
