import type { UseFormRegisterReturn } from "react-hook-form";

import { Textarea } from "@/components/ui/textarea";
import { BranchFieldError } from "@/features/branches/components/branch-field-error";

type BranchAddressFieldProps = {
  error?: string;
  onChange: (value: string) => void;
  registration?: UseFormRegisterReturn;
  value: string;
};

// Controlled address field with realtime validation feedback.
export function BranchAddressField({
  error,
  onChange,
  registration,
  value,
}: BranchAddressFieldProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      Address
      <Textarea
        aria-describedby={error ? "address-error" : undefined}
        aria-invalid={Boolean(error)}
        className="min-h-24 bg-white"
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
