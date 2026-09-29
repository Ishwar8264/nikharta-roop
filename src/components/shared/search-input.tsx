"use client";

import { CircleX, Loader2, Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputSize = "sm" | "md" | "lg";
type SearchInputRounded = "none" | "sm" | "md" | "lg" | "full";
type SearchInputVariant = "default" | "filled" | "ghost";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  clearable?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  submitLabel?: string | null;
  /** Field height + text size. Defaults to "md". */
  size?: SearchInputSize;
  /** Corner radius override. Defaults to "md". */
  rounded?: SearchInputRounded;
  /** Visual weight. Defaults to "default" (bordered). */
  variant?: SearchInputVariant;
  className?: string;
}

/**
 * Size tokens — kept in one place so height, text, and icon offsets can
 * never drift apart. `searchIconLeft` positions the leading icon based on
 * the same scale; if you add a size, you add it here.
 */
const SIZE_STYLES: Record<
  SearchInputSize,
  {
    input: string;
    icon: string;
    spinner: string;
    button: "sm" | "default" | "lg";
  }
> = {
  sm: {
    input: "h-9 text-sm pl-8 pr-8",
    icon: "left-2.5 h-3.5 w-3.5",
    spinner: "right-2.5 h-3.5 w-3.5",
    button: "sm",
  },
  md: {
    input: "h-11 text-sm pl-9 pr-9",
    icon: "left-3 h-4 w-4",
    spinner: "right-3 h-3.5 w-3.5",
    button: "default",
  },
  lg: {
    input: "h-12 text-base pl-10 pr-10",
    icon: "left-3.5 h-4 w-4",
    spinner: "right-3.5 h-4 w-4",
    button: "lg",
  },
};

/**
 * Radius overrides — expressed as `!rounded-*` because the design system
 * forces `border-radius: 0` on `[data-slot="input"]` via an unlayered rule.
 * Only the `!` important flag wins against an unlayered author style.
 */
const ROUNDED_STYLES: Record<SearchInputRounded, string> = {
  none: "!rounded-none",
  sm: "!rounded-sm",
  md: "!rounded-md",
  lg: "!rounded-lg",
  full: "!rounded-full",
};

/**
 * Variants — default is the bordered input from the design system. Filled
 * and ghost drop the border in favour of background emphasis, which reads
 * better on a dense listing header.
 */
const VARIANT_STYLES: Record<SearchInputVariant, string> = {
  default: "",
  filled:
    "!border-transparent !bg-muted focus-visible:!border-ring focus-visible:!bg-background",
  ghost:
    "!border-transparent !bg-transparent hover:!bg-muted focus-visible:!bg-muted",
};

/**
 * Controlled search field.
 *
 * Why controlled:
 * The parent owns the query so it can also drive the URL, sync on Back, and
 * reset the field from a "Clear all" action.
 *
 * Why optional onSubmit:
 * On listing pages the query is debounced into the URL, not submitted. On
 * short forms the explicit submit is clearer. Both are the same component.
 *
 * Why size/rounded/variant are separate props:
 * They are orthogonal — a compact filled pill and a large bordered card
 * search are both legitimate. Composing them as one "appearance" string
 * would force an N×M matrix of values for no gain.
 */
export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Search…",
  "aria-label": ariaLabel = "Search",
  clearable = true,
  disabled,
  isLoading,
  submitLabel = "Search",
  size = "md",
  rounded = "md",
  variant = "default",
  className,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const sizeStyles = SIZE_STYLES[size];
  const hasSubmit = submitLabel !== null && onSubmit !== undefined;
  const showClear = clearable && value && !disabled && !hasSubmit;
  const showSubmit = hasSubmit;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit?.(value.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn("flex gap-2", className)}
    >
      <div className="relative flex-1">
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 transition-colors",
            sizeStyles.icon,
            isFocused ? "text-foreground" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />

        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-busy={isLoading}
          className={cn(
            sizeStyles.input,
            ROUNDED_STYLES[rounded],
            VARIANT_STYLES[variant],
            (isLoading || showClear) && "pr-9",
          )}
        />

        {isLoading ? (
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2",
              sizeStyles.spinner,
            )}
          >
            <Loader2
              className="h-full w-full animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          </span>
        ) : showClear ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              onSubmit?.("");
            }}
            aria-label="Clear search"
            className={cn(
              "absolute top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              size === "lg" ? "right-3" : "right-2",
            )}
          >
            <CircleX
              className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"}
              aria-hidden="true"
            />
          </button>
        ) : null}
      </div>

      {showSubmit ? (
        <Button
          type="submit"
          size={sizeStyles.button}
          disabled={disabled || isLoading}
        >
          {submitLabel}
        </Button>
      ) : null}
    </form>
  );
}
