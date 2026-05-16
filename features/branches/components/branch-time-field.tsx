"use client";

import { Clock } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BranchFieldError } from "@/features/branches/components/branch-field-error";
import {
  BRANCH_TIME_OPTIONS,
  formatBranchTime,
} from "@/features/branches/helpers/branch-time-options";
import type {
  BranchFormErrors,
  BranchFormValues,
} from "@/features/branches/types/branch-form.types";

type BranchTimeFieldProps = {
  errors: BranchFormErrors;
  label: string;
  name: "closeTime" | "openTime";
  onChange: (name: keyof BranchFormValues, value: string) => void;
  registration?: UseFormRegisterReturn;
  value: string;
};

// Shadcn-style popover picker avoids inconsistent native time UI.
export function BranchTimeField({
  errors,
  label,
  name,
  onChange,
  registration,
  value,
}: BranchTimeFieldProps) {
  const error = errors[name];

  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <input
        name={name}
        onBlur={registration?.onBlur}
        readOnly
        ref={registration?.ref}
        type="hidden"
        value={value}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            aria-invalid={Boolean(error)}
            className="h-11 justify-between bg-white font-normal"
            type="button"
            variant="outline"
          >
            {formatBranchTime(value)}
            <Clock className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="max-h-72 w-64 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {BRANCH_TIME_OPTIONS.map((time) => (
              <Button
                key={time}
                onClick={() => onChange(name, time)}
                type="button"
                variant={time === value ? "default" : "outline"}
              >
                {formatBranchTime(time)}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <BranchFieldError id={`${name}-error`} message={error} />
    </label>
  );
}
