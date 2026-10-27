"use client";

import { parseTime } from "@internationalized/date";
import { DateInput, DateSegment, I18nProvider, TimeField as AriaTimeField } from "react-aria-components";

interface TimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

/** Fixed-locale time segments preserve HH:mm values and normalize Intl whitespace across runtimes. */
export function TimeField({ value, onChange, label, disabled }: TimeFieldProps) {
  return (
    <I18nProvider locale="en-IN">
    <AriaTimeField
      aria-label={label}
      value={value ? parseTime(value) : null}
      onChange={(time) => onChange(time ? `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}` : "")}
      hourCycle={12}
      granularity="minute"
      shouldForceLeadingZeros
      isDisabled={disabled}
      isRequired
      className="min-w-0 flex-1"
    >
      <DateInput className="flex h-8 items-center rounded-lg border border-input bg-background px-2 text-sm tabular-nums transition-colors data-focus-within:border-ring data-focus-within:ring-2 data-focus-within:ring-ring/30 data-disabled:opacity-50 data-invalid:border-destructive">
        {(segment) => (
          <DateSegment segment={segment} className="rounded-sm py-0.5 outline-none data-focused:bg-primary data-focused:text-primary-foreground data-placeholder:text-muted-foreground data-[type=literal]:whitespace-pre">
            {segment.type === "literal" ? segment.text.replace(/\s+/gu, " ") : segment.text}
          </DateSegment>
        )}
      </DateInput>
    </AriaTimeField>
    </I18nProvider>
  );
}
