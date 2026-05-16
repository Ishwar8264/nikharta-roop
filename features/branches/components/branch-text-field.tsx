import type { UseFormRegisterReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { BranchFieldError } from "@/features/branches/components/branch-field-error";
import type {
  BranchFormErrors,
  BranchFormValues,
} from "@/features/branches/types/branch-form.types";

type BranchTextFieldProps = {
  errors: BranchFormErrors;
  label: string;
  name: keyof BranchFormValues;
  onBlur?: (name: keyof BranchFormValues) => void;
  onChange: (name: keyof BranchFormValues, value: string) => void;
  placeholder?: string;
  registration?: UseFormRegisterReturn;
  required?: boolean;
  type?: string;
  value: string;
};

// Controlled input used by create and edit branch forms.
export function BranchTextField({
  errors,
  label,
  name,
  onBlur,
  onChange,
  placeholder,
  registration,
  required,
  type = "text",
  value,
}: BranchTextFieldProps) {
  const error = errors[name];

  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <Input
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={Boolean(error)}
        className="h-11 bg-white"
        name={name}
        onBlur={(event) => {
          registration?.onBlur(event);
          onBlur?.(name);
        }}
        onChange={(event) => {
          registration?.onChange(event);
          onChange(name, event.currentTarget.value);
        }}
        placeholder={placeholder}
        ref={registration?.ref}
        required={required}
        spellCheck={false}
        step={type === "number" ? "any" : undefined}
        type={type}
        value={value}
      />
      <BranchFieldError id={`${name}-error`} message={error} />
    </label>
  );
}
