"use client";

import type { SelectProps } from "@/components/ui/select";
import { useId, type ComponentProps, type ReactNode } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectFieldOption<Value extends string> {
  value: Value;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps<Value extends string>
  extends Omit<SelectProps<Value>, "children" | "items" | "multiple"> {
  label: ReactNode;
  options: readonly SelectFieldOption<Value>[];
  placeholder?: string;
  description?: ReactNode;
  error?: string;
  className?: string;
  triggerProps?: Omit<
    ComponentProps<typeof SelectTrigger>,
    "children" | "id" | "disabled"
  >;
  contentProps?: Omit<ComponentProps<typeof SelectContent>, "children">;
}

/** Reusable single-select field with readable labels, accessible errors and a non-overlapping popup. */
export function SelectField<Value extends string>({
  id: providedId,
  label,
  options,
  placeholder = "Select an option",
  description,
  error,
  className,
  triggerProps,
  contentProps,
  disabled,
  ...selectProps
}: SelectFieldProps<Value>) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const describedBy =
    [
      triggerProps?.["aria-describedby"],
      description != null && `${id}-description`,
      error && `${id}-error`,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label id={`${id}-label`} htmlFor={id}>
        {label}
      </Label>
      <Select<Value>
        {...selectProps}
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        isInvalid={Boolean(error) || selectProps.isInvalid}
        disabled={disabled || options.length === 0}
      >
        <SelectTrigger
          {...triggerProps}
          id={id}
          aria-invalid={error ? true : triggerProps?.["aria-invalid"]}
          aria-describedby={describedBy}
          className={cn("w-full min-w-0", triggerProps?.className)}
        >
          <SelectValue className="min-w-0 truncate" placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent align="start" {...contentProps}>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description != null && (
        <p id={`${id}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
