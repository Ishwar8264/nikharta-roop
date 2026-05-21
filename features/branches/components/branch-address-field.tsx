/**
 * Purpose: Controlled address field for branch admin forms.
 * Responsibilities: connect RHF registration, local value updates, and inline validation feedback.
 * Important notes: the textarea keeps a stable id so its label and error text stay accessible.
 */
import type { UseFormRegisterReturn } from "react-hook-form";

import { Textarea } from "@/components/ui/textarea";
import { BranchFieldError } from "@/features/branches/components/branch-field-error";

type BranchAddressFieldProps = {
  error?: string;
  onChange: (value: string) => void;
  registration?: UseFormRegisterReturn;
  value: string;
};

/**
 * Renders the branch address textarea with realtime validation feedback.
 */
export function BranchAddressField({
  error,
  onChange,
  registration,
  value,
}: BranchAddressFieldProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium" htmlFor="address">
      Address
      <Textarea
        aria-describedby={error ? "address-error" : undefined}
        aria-invalid={Boolean(error)}
        className="min-h-24 bg-white"
        id="address"
        name="address"
        onBlur={registration?.onBlur}
        onChange={(event) => {
          registration?.onChange(event);
          onChange(event.currentTarget.value);
        }}
        placeholder="Shop number, road, landmark, city"
        ref={registration?.ref}
        required
        value={value}
      />
      <BranchFieldError id="address-error" message={error} />
    </label>
  );
}
