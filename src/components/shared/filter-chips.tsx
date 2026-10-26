"use client";

import { Check, ChevronDown, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface FilterChipOption<T extends string = string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

type FilterChipsVariant = "default" | "filled" | "outline";
type FilterChipsSize = "sm" | "md" | "lg";
type FilterChipsDisplay = "chips" | "dropdown";

interface FilterChipsProps<T extends string = string> {
  options: FilterChipOption<T>[];
  /** Current selection. `null` or `undefined` means "All". */
  value: T | null | undefined;
  onChange: (value: T | null) => void;
  /** Optional "All" chip. `null` hides it entirely. */
  allLabel?: string | null;
  /** Inline pill row, or a single compact dropdown. Defaults to "chips". */
  display?: FilterChipsDisplay;
  /** Dropdown trigger label when nothing is selected. */
  dropdownLabel?: string;
  size?: FilterChipsSize;
  variant?: FilterChipsVariant;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Single-select filter — inline chips or a compact dropdown.
 *
 * Why one component, two displays:
 * The filtering logic, options shape, and value contract are identical.
 * Only the affordance differs. Splitting into two components would force
 * every consumer to know which one to import, and any change to the option
 * shape would have to be made twice.
 *
 * Why the dropdown variant exists:
 * On a narrow viewport or a dense toolbar, five chips eat an entire row and
 * push the results below the fold. A single "Category: All" trigger keeps
 * the filter reachable in ~40px of horizontal space.
 */
export function FilterChips<T extends string = string>({
  options,
  value,
  onChange,
  allLabel = "All",
  display = "chips",
  dropdownLabel = "Filter",
  size = "md",
  variant = "default",
  disabled,
  className,
  "aria-label": ariaLabel,
}: FilterChipsProps<T>) {
  if (display === "dropdown") {
    return (
      <FilterDropdown
        options={options}
        value={value}
        onChange={onChange}
        allLabel={allLabel}
        triggerLabel={dropdownLabel}
        size={size}
        disabled={disabled}
        className={className}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <FilterChipRow
      options={options}
      value={value}
      onChange={onChange}
      allLabel={allLabel}
      size={size}
      variant={variant}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Chips display (inline row)
// ─────────────────────────────────────────────────────────────

function FilterChipRow<T extends string>({
  options,
  value,
  onChange,
  allLabel,
  size,
  variant,
  disabled,
  className,
  "aria-label": ariaLabel,
}: Omit<FilterChipsProps<T>, "display" | "dropdownLabel">) {
  const sizeClass =
    size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-xs sm:text-sm";

  return (
    <div
      role="group"
      aria-label={ariaLabel ?? "Filter"}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {allLabel != null ? (
        <Chip
          label={allLabel}
          active={value == null}
          sizeClass={sizeClass}
          variant={variant ?? "default"}
          disabled={disabled}
          onClick={() => onChange(null)}
        />
      ) : null}

      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          icon={option.icon}
          active={value === option.value}
          sizeClass={sizeClass}
          variant={variant ?? "default"}
          disabled={disabled}
          onClick={() => onChange(option.value)}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dropdown display
// ─────────────────────────────────────────────────────────────

function FilterDropdown<T extends string>({
  options,
  value,
  onChange,
  allLabel = "All",
  triggerLabel,
  size,
  disabled,
  "aria-label": ariaLabel,
}: Omit<FilterChipsProps<T>, "display" | "variant"> & {
  triggerLabel: string;
}) {
  const selected = options.find((option) => option.value === value);
  const SelectedIcon = selected?.icon;
  const sizeClass =
    size === "sm"
      ? "h-9 text-xs"
      : size === "lg"
        ? "h-12 text-sm"
        : "h-11 text-sm";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel ?? "Filter"}
            className={cn("h-11 rounded-md shrink-0 gap-2", sizeClass)}
          />
        }
      >
        {SelectedIcon ? (
          <SelectedIcon className="h-3.5 w-3.5" aria-hidden="true" />
        ) : null}
        <span>{selected?.label ?? allLabel ?? triggerLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-44">
        {allLabel != null ? (
          <DropdownItem
            label={allLabel}
            active={value == null}
            onSelect={() => onChange(null)}
          />
        ) : null}

        {options.map((option) => (
          <DropdownItem
            key={option.value}
            label={option.label}
            icon={option.icon}
            active={value === option.value}
            onSelect={() => onChange(option.value)}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownItem({
  label,
  icon: Icon,
  active,
  onSelect,
}: {
  label: string;
  icon?: LucideIcon;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      textValue={label}
      onAction={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2",
        active && "bg-accent",
      )}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      <span className="flex-1">{label}</span>
      {active ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
    </DropdownMenuItem>
  );
}

// ─────────────────────────────────────────────────────────────
// Chip primitives (chips display)
// ─────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<
  FilterChipsVariant,
  { base: string; active: string; inactive: string }
> = {
  default: {
    base: "border",
    active: "border-primary bg-primary/10 text-primary",
    inactive:
      "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
  },
  filled: {
    base: "border border-transparent",
    active: "bg-primary text-primary-foreground",
    inactive:
      "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
  },
  outline: {
    base: "border",
    active: "border-primary text-primary",
    inactive: "border-border text-muted-foreground hover:border-primary/40",
  },
};

function Chip({
  label,
  icon: Icon,
  active,
  sizeClass,
  variant,
  disabled,
  onClick,
}: {
  label: string;
  icon?: LucideIcon;
  active: boolean;
  sizeClass: string;
  variant: FilterChipsVariant;
  disabled?: boolean;
  onClick: () => void;
}) {
  const styles = VARIANT_STYLES[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        sizeClass,
        styles.base,
        active ? styles.active : styles.inactive,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {label}
    </button>
  );
}
