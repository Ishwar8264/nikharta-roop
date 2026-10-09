"use client";

import { SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { EmptyState, FilterChips, SearchInput } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { routes } from "@/config/routes";
import { appointmentPriceFormatter } from "@/features/appointment/format";
import { ApiError } from "@/lib/api/backend.client";

import {
  activateTemplateApi,
  deactivateTemplateApi,
  updateActivationApi,
} from "./api";
import type { ActivationRow } from "./types";

type KindFilter = "SERVICE" | "PACKAGE";

interface ActivationPanelProps {
  salonSlug: string;
  rows: ActivationRow[];
}

interface CardState {
  price: string;
  isActive: boolean;
  /** Server round-trip in progress for this card. */
  busy: boolean;
  error: string | null;
}

/**
 * Catalog activation grid — optimistic toggles with rollback, price saved on
 * blur. The toggle flips immediately; any API failure restores the prior
 * state and explains itself with a toast.
 */
export function ActivationPanel({ salonSlug, rows }: ActivationPanelProps) {
  const router = useRouter();
  const [kind, setKind] = useState<KindFilter | null>(null);
  const [search, setSearch] = useState("");
  const [states, setStates] = useState<Record<string, CardState>>(() =>
    Object.fromEntries(
      rows.map((row) => [
        row.template.id,
        {
          price: row.activation ? String(row.activation.price) : "",
          isActive: row.activation?.isActive ?? false,
          busy: false,
          error: null,
        } satisfies CardState,
      ]),
    ),
  );
  const priceRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (kind && row.template.kind !== kind) return false;
      if (!query) return true;
      const haystack =
        `${row.template.name} ${row.template.description ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, kind, search]);

  const activeCount = rows.filter(
    (row) => states[row.template.id]?.isActive,
  ).length;

  function patchState(templateId: string, patch: Partial<CardState>) {
    setStates((prev) => ({
      ...prev,
      [templateId]: { ...prev[templateId], ...patch },
    }));
  }

  /** Activates with the current price, or focuses the input with an error. */
  async function handleToggle(row: ActivationRow, next: boolean) {
    const { template } = row;
    const current = states[template.id];
    const price = parsePrice(current.price);

    if (next && price === null) {
      patchState(template.id, {
        isActive: false,
        error: "Add a price to activate this item.",
      });
      priceRefs.current[template.id]?.focus();
      return;
    }

    const previous = current;
    patchState(template.id, { busy: true, error: null, isActive: next });
    try {
      if (next) {
        await activateTemplateApi(salonSlug, {
          templateKey: template.key,
          price: price as number,
        });
        toast.success(`${template.name} is now visible to customers.`);
      } else {
        await deactivateTemplateApi(salonSlug, template.key);
        toast.success(`${template.name} is hidden from customers.`);
      }
      patchState(template.id, { busy: false });
      router.refresh();
    } catch (error) {
      patchState(template.id, {
        busy: false,
        isActive: previous.isActive,
        error: null,
      });
      toast.error(
        errorMessage(error, "Something went wrong. Please try again."),
      );
    }
  }

  /** Saves the price on blur; no-op when nothing changed or card is off. */
  async function handlePriceBlur(row: ActivationRow) {
    const { template } = row;
    const current = states[template.id];
    const price = parsePrice(current.price);

    if (price === null) {
      if (current.isActive) {
        patchState(template.id, {
          error: "Enter a price greater than zero.",
        });
        priceRefs.current[template.id]?.focus();
      }
      return;
    }
    if (!current.isActive) return;
    if (row.activation && row.activation.price === price) return;

    patchState(template.id, { busy: true, error: null });
    try {
      await updateActivationApi(salonSlug, template.key, { price });
      patchState(template.id, { busy: false });
      toast.success(
        `Price saved — ${appointmentPriceFormatter.format(price)}.`,
      );
      router.refresh();
    } catch (error) {
      patchState(template.id, { busy: false });
      toast.error(
        errorMessage(error, "Could not save the price. Please try again."),
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <FilterChips<KindFilter>
          options={[
            { value: "SERVICE", label: "Services" },
            { value: "PACKAGE", label: "Packages" },
          ]}
          value={kind}
          onChange={setKind}
          allLabel="All"
          aria-label="Filter by type"
        />
        <div className="sm:w-64">
          <SearchInput
            value={search}
            onChange={setSearch}
            submitLabel={null}
            size="sm"
            placeholder="Search templates…"
            aria-label="Search templates"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        You&rsquo;ve activated {activeCount} of {rows.length} templates.
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No templates match"
          description="Try a different search term or clear the type filter."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => {
            const state = states[row.template.id];
            const price = parsePrice(state.price);
            return (
              <li
                key={row.template.id}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium leading-tight">
                        {row.template.name}
                      </h3>
                      <Badge variant="secondary">
                        {row.template.kind === "PACKAGE" ? "Package" : "Service"}
                      </Badge>
                    </div>
                    {row.template.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {row.template.description}
                      </p>
                    ) : null}
                  </div>
                  <Switch
                    checked={state.isActive}
                    onCheckedChange={(next) => handleToggle(row, next)}
                    disabled={state.busy}
                    aria-label={`Activate ${row.template.name}`}
                  />
                </div>

                <div className="mt-auto space-y-1.5">
                  <Label
                    htmlFor={`price-${row.template.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    Your price (₹)
                  </Label>
                  <Input
                    id={`price-${row.template.id}`}
                    ref={(el) => {
                      priceRefs.current[row.template.id] = el;
                    }}
                    type="number"
                    inputMode="decimal"
                    min={1}
                    step={1}
                    placeholder="e.g. 499"
                    value={state.price}
                    onChange={(e) =>
                      patchState(row.template.id, {
                        price: e.target.value,
                        error: null,
                      })
                    }
                    onBlur={() => handlePriceBlur(row)}
                    disabled={state.busy}
                    aria-invalid={Boolean(state.error)}
                  />
                  {state.error ? (
                    <p role="alert" className="text-xs text-destructive">
                      {state.error}
                    </p>
                  ) : price !== null && state.isActive ? (
                    <p className="text-xs text-muted-foreground">
                      Customers pay {appointmentPriceFormatter.format(price)}.
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-sm text-muted-foreground">
        Customers only see active items.{" "}
        <a
          href={routes.salonDetail(salonSlug)}
          className="text-primary underline"
        >
          View your public page
        </a>
      </p>
    </div>
  );
}

/** Parses a rupee amount typed into the price input. */
function parsePrice(value: string): number | null {
  const trimmed = value.replace(/[₹,\s]/g, "");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

/** Reads an API failure into user-facing copy. */
function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
