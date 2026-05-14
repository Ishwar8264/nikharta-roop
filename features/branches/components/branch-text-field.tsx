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
  onChange: (name: keyof BranchFormValues, value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
};

// Controlled input used by create and edit branch forms.
export function BranchTextField({
  errors,
  label,
  name,
  onChange,
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
        onChange={(event) => onChange(name, event.currentTarget.value)}
        required={required}
        step={type === "number" ? "any" : undefined}
        type={type}
        value={value}
      />
      <BranchFieldError id={`${name}-error`} message={error} />
    </label>
  );
}
