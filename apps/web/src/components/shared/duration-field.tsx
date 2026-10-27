"use client";

import { SelectField, type SelectFieldProps } from "./select-field";

export interface DurationFieldProps extends Omit<SelectFieldProps<string>, "value" | "defaultValue" | "onValueChange" | "options" | "label"> {
  maxMinutes?: number;
  value: number;
  onValueChange: (minutes: number) => void;
  label?: SelectFieldProps<string>["label"];
}

const durationOptions = (maxMinutes: number) => Array.from({ length: Math.floor(maxMinutes / 5) }, (_, index) => {
  const minutes = (index + 1) * 5;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return {
    value: String(minutes),
    label: hours ? `${hours} hr${remainder ? ` ${remainder} min` : ""}` : `${minutes} min`,
  };
});

/** Selects a duration in minutes and preserves existing values between preset steps. */
export function DurationField({ value, onValueChange, label = "Duration", maxMinutes = 480, ...props }: DurationFieldProps) {
  const presets = durationOptions(maxMinutes);
  const selected = String(value);
  const options = presets.some((option) => option.value === selected)
    ? presets
    : [...presets, { value: selected, label: `${value} min` }].sort((a, b) => Number(a.value) - Number(b.value));

  return (
    <SelectField
      {...props}
      label={label}
      value={selected}
      options={options}
      onValueChange={(next) => { if (next !== null) onValueChange(Number(next)); }}
    />
  );
}
