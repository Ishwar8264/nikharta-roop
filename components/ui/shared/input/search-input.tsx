/**
 * Purpose: Shared search input with debounce, clear, loading, and validation states.
 * Responsibilities: support controlled/uncontrolled values, keyboard search, and status icons.
 * Important notes: React 19 passes refs as regular props, so this component avoids forwardRef.
 */
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X, Loader2, AlertCircle, Check } from "lucide-react";

// ─────────────────────────────────────────────
// Props Interface
// ─────────────────────────────────────────────

export interface SearchInputProps extends Omit<
  React.ComponentProps<"input">,
  "type" | "onChange" | "onClear"
> {
  // ── Label Props ──
  label?: string;
  labelClassName?: string;
  showRequiredIndicator?: boolean;
  requiredIndicator?: React.ReactNode;
  hideLabel?: boolean;

  // ── Validation Props ──
  error?: string;
  success?: string;
  helperText?: string;

  // ── Search Icon Props ──
  searchIcon?: React.ReactNode;
  searchIconClassName?: string;
  hideSearchIcon?: boolean;

  // ── Clear Button Props ──
  showClearButton?: boolean;
  clearButtonClassName?: string;
  clearIcon?: React.ReactNode;
  onClear?: (value: string) => void;

  // ── Loading Props ──
  loading?: boolean;
  loaderIcon?: React.ReactNode;
  loaderClassName?: string;

  // ── Status Icon Props ──
  showErrorIcon?: boolean;
  showSuccessIcon?: boolean;
  customErrorIcon?: React.ReactNode;
  customSuccessIcon?: React.ReactNode;
  errorIconClassName?: string;
  successIconClassName?: string;

  // ── Right Extra Icon ──
  rightIcon?: React.ReactNode;
  rightIconClassName?: string;

  // ── Container Props ──
  containerClassName?: string;
  inputContainerClassName?: string;
  helperTextClassName?: string;
  rightIconsContainerClassName?: string;

  // ── Input Props ──
  inputClassName?: string;
  placeholder?: string;

  // ── Behavior Props ──
  required?: boolean;
  disabled?: boolean;
  value?: string;
  defaultValue?: string;

  // ── Callback Props ──
  onChange?: (e: React.ChangeEvent<HTMLInputElement>, value: string) => void;
  onSearch?: (value: string) => void;
  onSearchDebounced?: (value: string) => void;

  // ── Debounce Props ──
  debounceTime?: number;
  minLength?: number;

  // ── Keyboard Props ──
  searchOnEnter?: boolean;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

/**
 * Renders a configurable search input for filters, lists, and lookup flows.
 */
// Shared primitive keeps its broad prop API for existing search field call sites.
// react-doctor-disable-next-line react-doctor/no-giant-component, react-doctor/no-many-boolean-props
function SearchInput({
      // Label
      label,
      labelClassName,
      showRequiredIndicator = true,
      requiredIndicator,
      hideLabel = false,

      // Validation
      error,
      success,
      helperText,

      // Search Icon
      searchIcon,
      searchIconClassName,
      hideSearchIcon = false,

      // Clear Button
      showClearButton = true,
      clearButtonClassName,
      clearIcon,
      onClear,

      // Loading
      loading = false,
      loaderIcon,
      loaderClassName,

      // Status Icons
      showErrorIcon = true,
      showSuccessIcon = true,
      customErrorIcon,
      customSuccessIcon,
      errorIconClassName,
      successIconClassName,

      // Right Extra Icon
      rightIcon,
      rightIconClassName,

      // Container
      containerClassName,
      inputContainerClassName,
      helperTextClassName,
      rightIconsContainerClassName,

      // Input
      inputClassName,
      className,
      placeholder = "Search...",

      // Behavior
      required,
      disabled,
      value: controlledValue,
      defaultValue,

      // Callbacks
      onChange,
      onSearch,
      onSearchDebounced,

      // Debounce
      debounceTime = 300,
      minLength = 0,

      // Keyboard
      searchOnEnter = true,

      // Standard
      id,
      ref,
      ...props
    }: SearchInputProps) {
    // ── State ──
    const [internalValue, setInternalValue] = React.useState(
      defaultValue ?? "",
    );
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    // ── Debounce Timer ──
    const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    // ── Handlers ──
    /**
     * Updates the current search value and schedules debounced search callbacks.
     */
    const updateSearchValueFromInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;

      if (!isControlled) {
        setInternalValue(val);
      }

      onChange?.(e, val);

      // Debounced search callback
      if (onSearchDebounced) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          if (val.length >= minLength) {
            onSearchDebounced(val);
          } else if (val.length === 0) {
            onSearchDebounced("");
          }
        }, debounceTime);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && searchOnEnter) {
        // Flush any pending debounce
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        if (currentValue.length >= minLength) {
          onSearch?.(currentValue);
        }
      }

      props.onKeyDown?.(e);
    };

    const handleClear = () => {
      if (!isControlled) {
        setInternalValue("");
      }

      onClear?.("");

      // Trigger search with empty value
      if (onSearchDebounced) {
        onSearchDebounced("");
      }
      if (onSearch) {
        onSearch("");
      }
    };

    // ── Derived State ──
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success);
    const hasValue = currentValue.length > 0;

    const shouldShowErrorIcon = hasError && showErrorIcon;
    const shouldShowSuccessIcon = hasSuccess && showSuccessIcon && !hasError;
    const shouldShowClearButton =
      showClearButton && hasValue && !loading && !disabled;
    const shouldShowLoader = loading;
    const shouldShowRightIcon =
      rightIcon &&
      !loading &&
      !shouldShowClearButton &&
      !hasError &&
      !hasSuccess;

    const hasRightContent =
      shouldShowErrorIcon ||
      shouldShowSuccessIcon ||
      shouldShowClearButton ||
      shouldShowLoader ||
      shouldShowRightIcon;

    const showSearchIcon = !hideSearchIcon && !loading;

    return (
      <div className={cn("w-full space-y-1.5", containerClassName)}>
        {/* ── Label ── */}
        {label && !hideLabel && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium transition-colors",
              disabled && "opacity-50 cursor-not-allowed",
              hasError && "text-destructive",
              labelClassName,
            )}
          >
            {label}
            {required && showRequiredIndicator && (
              <>
                {requiredIndicator || (
                  <span className="text-destructive ml-1">*</span>
                )}
              </>
            )}
          </label>
        )}

        {/* ── Input Container ── */}
        <div className={cn("relative", inputContainerClassName)}>
          {/* Left: Search Icon */}
          {showSearchIcon && (
            <div
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none",
                disabled ? "opacity-50" : "text-muted-foreground",
                searchIconClassName,
              )}
            >
              {searchIcon || <Search className="size-4" />}
            </div>
          )}

          {/* Left: Loader (replaces search icon position) */}
          {loading && (
            <div
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none",
                disabled ? "opacity-50" : "text-muted-foreground",
                loaderClassName,
              )}
            >
              {loaderIcon || <Loader2 className="size-4 animate-spin" />}
            </div>
          )}

          {/* ── Input Field ── */}
          <Input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="search"
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            value={currentValue}
            aria-invalid={hasError ? "true" : "false"}
            aria-label={!label || hideLabel ? "Search" : undefined}
            aria-describedby={
              error || success || helperText
                ? `${inputId}-description`
                : undefined
            }
            className={cn(
              // Icon padding
              (showSearchIcon || loading) && "pl-10",
              hasRightContent && "pr-10",
              // Validation states
              hasError &&
                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
              hasSuccess &&
                "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/20",
              // Custom
              inputClassName || className,
            )}
            onChange={updateSearchValueFromInput}
            onKeyDown={handleKeyDown}
            {...props}
          />

          {/* ── Right Icons ── */}
          {hasRightContent && (
            <div
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5",
                rightIconsContainerClassName,
              )}
            >
              {/* Loader (right side fallback ,  if you want it right) */}
              {/* We show loader on left, so this is for extra right content */}

              {/* Error Icon */}
              {shouldShowErrorIcon && (
                <div className={cn("shrink-0", errorIconClassName)}>
                  {customErrorIcon || (
                    <AlertCircle className="size-4 text-destructive" />
                  )}
                </div>
              )}

              {/* Success Icon */}
              {shouldShowSuccessIcon && (
                <div className={cn("shrink-0", successIconClassName)}>
                  {customSuccessIcon || (
                    <Check className="size-4 text-green-500" />
                  )}
                </div>
              )}

              {/* Clear Button */}
              {shouldShowClearButton && (
                <button
                  type="button"
                  onClick={handleClear}
                  className={cn(
                    "shrink-0 text-muted-foreground hover:text-foreground transition-colors rounded-sm",
                    clearButtonClassName,
                  )}
                  tabIndex={-1}
                  aria-label="Clear search"
                >
                  {clearIcon || <X className="size-4" />}
                </button>
              )}

              {/* Loading spinner on right (optional, if no left icon) */}
              {shouldShowLoader && hideSearchIcon && (
                <div className={cn("shrink-0", loaderClassName)}>
                  {loaderIcon || (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              )}

              {/* Custom Right Icon */}
              {shouldShowRightIcon && (
                <div
                  className={cn(
                    "shrink-0 text-muted-foreground",
                    rightIconClassName,
                  )}
                >
                  {rightIcon}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Helper / Error / Success Text ── */}
        {(error || success || helperText) && (
          <p
            id={`${inputId}-description`}
            className={cn(
              "text-xs transition-colors",
              hasError && "text-destructive",
              hasSuccess && "text-green-600 dark:text-green-500",
              !hasError && !hasSuccess && "text-muted-foreground",
              helperTextClassName,
            )}
          >
            {error || success || helperText}
          </p>
        )}
      </div>
    );
}

export { SearchInput };

// Usage Examples

/* 

// ── 1. Basic ──
<SearchInput
  placeholder="Search users..."
  onSearchDebounced={(val) => console.log("debounced:", val)}
/>

// ── 2. Controlled ──
const [query, setQuery] = useState("");

<SearchInput
  value={query}
  onChange={(e, val) => setQuery(val)}
  onSearch={(val) => fetchResults(val)}
  onClear={() => setQuery("")}
/>

// ── 3. With Loading ──
<SearchInput
  loading={isSearching}
  placeholder="Search products..."
  onSearchDebounced={(val) => searchProducts(val)}
  debounceTime={500}
  minLength={3}
/>

// ── 4. With Validation ──
<SearchInput
  label="Search Email"
  error="No results found"
  helperText="Try a different keyword"
  onSearch={(val) => validateSearch(val)}
/>

// ── 5. Custom Icons ──
<SearchInput
  searchIcon={<MyCustomSearchIcon />}
  clearIcon={<MyCustomClearIcon />}
  showClearButton
/>

// ── 6. No Search Icon + Right Loader ──
<SearchInput
  hideSearchIcon
  loading={isLoading}
  rightIcon={<FilterIcon />}
/>

// ── 7. Search on Enter only (no debounce) ──
<SearchInput
  placeholder="Press Enter to search..."
  searchOnEnter
  onSearch={(val) => handleSearch(val)}
/>

// ── 8. Full Featured ──
<SearchInput
  label="Search Orders"
  required
  placeholder="Order ID, customer name..."
  loading={isFetching}
  error={searchError}
  success={searchSuccess}
  helperText="Min 3 characters"
  minLength={3}
  debounceTime={400}
  showClearButton
  onSearchDebounced={(val) => debouncedSearch(val)}
  onSearch={(val) => immediateSearch(val)}
  onClear={(val) => resetSearch()}
  containerClassName="max-w-md"
  inputClassName="rounded-full"
  searchIconClassName="text-blue-500"
/>



*/
