"use client";

import { CircleCheckBig, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useId, useMemo, useState, type ComponentProps, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkSlugAvailability, findAvailableSlugSuggestions } from "@/lib/api/slug-availability";
import { slugMaxLength, slugValidationMessage, type SlugAvailabilityQuery, type SlugAvailabilityResult, type SlugResource } from "@/lib/slug-availability";
import { cn } from "@/lib/utils";
import { SharedDialogContent } from "./shared-dialog-content";

export interface SlugFieldState {
  slug: string;
  status: "idle" | "invalid" | "checking" | "available" | "unavailable" | "unchanged" | "error";
  message: string;
  reason?: "taken" | "reserved";
}

type ScopeProps =
  | { resource: "service" | "product" | "package"; salonId: string | undefined }
  | { resource: Exclude<SlugResource, "service" | "product" | "package">; salonId?: never };

export type SlugFieldProps = ScopeProps & Omit<ComponentProps<typeof Input>, "value" | "defaultValue" | "onChange" | "type"> & {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  description?: ReactNode;
  error?: string;
  containerClassName?: string;
  debounceMs?: number;
  showSuggestions?: boolean;
  /** Turn off remote checks without disabling editing. */
  checkEnabled?: boolean;
  /** On edit forms, an unchanged existing slug does not need a uniqueness check. */
  currentSlug?: string;
  onAvailabilityChange?: (state: SlugFieldState) => void;
  /** Override the transport for another API or a component preview. */
  checkAvailability?: (query: SlugAvailabilityQuery, options: { signal: AbortSignal }) => Promise<SlugAvailabilityResult>;
};

/** Controlled, form-library-independent slug input with debounced checks and stale-response protection. */
export function SlugField({
  resource, salonId, value, onValueChange, label = "URL slug", description,
  error, containerClassName, debounceMs = 400, showSuggestions = true, checkEnabled = true, currentSlug,
  onAvailabilityChange, checkAvailability = checkSlugAvailability,
  id: providedId, disabled, readOnly, maxLength: providedMaxLength, className,
  "aria-describedby": describedBy, ...inputProps
}: SlugFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const slug = value.trim();
  const maxLength = Math.min(providedMaxLength ?? slugMaxLength(resource), slugMaxLength(resource));
  const scoped = resource === "service" || resource === "product" || resource === "package";
  const validationMessage = slugValidationMessage(slug, maxLength);
  const unchanged = Boolean(currentSlug && slug === currentSlug.trim());
  const canCheck = checkEnabled && !disabled && !readOnly && Boolean(slug) && !validationMessage && !unchanged && (!scoped || Boolean(salonId));
  const key = JSON.stringify([resource, salonId, slug]);
  const [dialogKey, setDialogKey] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [checked, setChecked] = useState<{ key: string; retry: number; state: SlugFieldState } | null>(null);
  const [suggestions, setSuggestions] = useState<{ key: string; retry: number; values: string[]; status: "loading" | "ready" | "error" } | null>(null);
  const [previousKey, setPreviousKey] = useState(key);
  // Reset during render so a returning value cannot display a result from an older request.
  if (previousKey !== key) {
    setPreviousKey(key);
    setChecked(null);
    setSuggestions(null);
  }

  const state = useMemo<SlugFieldState>(() => {
    if (validationMessage) return { slug, status: "invalid", message: validationMessage };
    if (unchanged) return { slug, status: "unchanged", message: "This is your current slug." };
    if (!canCheck) return { slug, status: "idle", message: scoped && !salonId && slug ? "Select a salon to check availability." : "" };
    if (checked?.key === key && checked.retry === retry) return checked.state;
    return { slug, status: "checking", message: "Checking availability…" };
  }, [validationMessage, unchanged, slug, canCheck, scoped, salonId, checked, key, retry]);

  useEffect(() => {
    if (!canCheck) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        let query: SlugAvailabilityQuery;
        if (resource === "service" || resource === "product" || resource === "package") {
          if (!salonId) return;
          query = { resource, slug, salonId };
        } else {
          query = { resource, slug };
        }
        const result = await checkAvailability(query, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setChecked({ key, retry, state: {
          slug,
          status: result.available ? "available" : "unavailable",
          reason: result.reason ?? undefined,
          message: result.available ? "This slug is available." : result.reason === "reserved" ? "This slug is reserved. Choose another." : "This slug is already taken. Choose another.",
        } });
        if (!result.available && showSuggestions) {
          setSuggestions({ key, retry, values: [], status: "loading" });
          try {
            const values = await findAvailableSlugSuggestions(query, { signal: controller.signal, maxLength }, checkAvailability);
            if (!controller.signal.aborted) setSuggestions({ key, retry, values, status: "ready" });
          } catch {
            if (!controller.signal.aborted) setSuggestions({ key, retry, values: [], status: "error" });
          }
        }
      } catch {
        if (!controller.signal.aborted) {
          setChecked({ key, retry, state: { slug, status: "error", message: "Could not check availability. Try again." } });
        }
      }
    }, Math.max(0, debounceMs));
    return () => { clearTimeout(timer); controller.abort(); };
  }, [canCheck, resource, salonId, slug, scoped, key, retry, debounceMs, checkAvailability, showSuggestions, maxLength]);

  useEffect(() => { onAvailabilityChange?.(state); }, [onAvailabilityChange, state]);

  const invalid = Boolean(error || state.status === "invalid" || state.status === "unavailable");
  const message = error || state.message;
  const visibleSuggestions = showSuggestions && state.status === "unavailable" && suggestions?.key === key && suggestions.retry === retry ? suggestions : null;
  return (
    <Dialog open={dialogKey === key && canCheck} onOpenChange={(open) => setDialogKey(open ? key : null)}>
      <div className={cn("space-y-1.5", containerClassName)}>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={id}>{label}</Label>
          {state.status === "unavailable" && (showSuggestions ? (
            <DialogTrigger render={<Button type="button" variant="destructive" size="xs" className="h-5 rounded-full px-2 text-[10px] tracking-wide" />} aria-label="Choose an available slug" title="Choose an available slug">
              {state.reason === "reserved" ? "RESERVED" : "TAKEN"}
            </DialogTrigger>
          ) : <span className="rounded-full bg-destructive/10 px-2 text-[10px] font-medium text-destructive">{state.reason === "reserved" ? "RESERVED" : "TAKEN"}</span>)}
        </div>
        <div className="relative">
          <Input {...inputProps} id={id} type="text" value={value} disabled={disabled} readOnly={readOnly}
            maxLength={maxLength} autoCapitalize="none" autoCorrect="off" spellCheck={false}
            onChange={(event) => onValueChange(event.target.value)}
            aria-invalid={invalid || inputProps["aria-invalid"] || undefined}
            aria-describedby={[describedBy, description && `${id}-description`, `${id}-status`].filter(Boolean).join(" ")}
            className={cn(
              "pr-8",
              invalid && "border-destructive bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/20 dark:bg-destructive/5",
              state.status === "available" && !invalid && !inputProps["aria-invalid"] && "border-success bg-success/5 focus-visible:border-success focus-visible:ring-success/20 dark:bg-success/5",
              className,
            )} />
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
            {state.status === "checking" && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
            {state.status === "available" && !error && <CircleCheckBig className="size-4 text-success" />}
          </span>
        </div>
        {description && <div id={`${id}-description`} className="text-right text-xs text-muted-foreground">{description}</div>}
        <div className={cn("flex items-center justify-end gap-2", !error && state.status !== "invalid" && state.status !== "error" && "sr-only")}>
          <p id={`${id}-status`} role="status" aria-live="polite" aria-atomic="true" className={cn("text-right text-xs text-muted-foreground", invalid && "text-destructive", state.status === "available" && !error && "text-success")}>{message}</p>
          {state.status === "error" && !error && <Button type="button" size="xs" variant="ghost" onClick={() => setRetry((count) => count + 1)}><RefreshCw className="size-3" /> Retry</Button>}
        </div>
      </div>
      <SharedDialogContent
        className="sm:max-w-md"
        title="Choose an available slug"
        description={<><span className="font-medium break-all text-foreground">{slug}</span> {state.reason === "reserved" ? "is reserved." : "is already taken."} Select an alternative or close this dialog to enter your own.</>}
        footer={<>
          <Button type="button" variant="ghost" onClick={() => setDialogKey(null)}>Close</Button>
          {visibleSuggestions?.status === "error" && <Button type="button" onClick={() => setRetry((count) => count + 1)}><RefreshCw className="size-3.5" /> Retry suggestions</Button>}
        </>}
      >
        <p role="status" className="text-sm text-muted-foreground">
          {!visibleSuggestions || visibleSuggestions.status === "loading" ? "Finding available alternatives…" : visibleSuggestions.status === "error" ? "Could not load suggestions. Please try again." : visibleSuggestions.values.length ? "Available alternatives" : "No available alternatives found. Try a different slug."}
        </p>
        {visibleSuggestions?.status === "ready" && <div className="grid gap-2 sm:grid-cols-2">
          {visibleSuggestions.values.map((suggestion) => <Button key={suggestion} type="button" variant="outline" className="h-auto min-h-10 max-w-full justify-start gap-2 whitespace-normal break-all px-3 py-2 text-left" onClick={() => { onValueChange(suggestion); setDialogKey(null); }}>
            <CircleCheckBig className="size-4 shrink-0 text-success" />{suggestion}
          </Button>)}
        </div>}
      </SharedDialogContent>
    </Dialog>
  );
}
