import type { UseFormRegister } from "react-hook-form";

import { BranchTextField } from "@/features/branches/components/branch-text-field";
import { BranchTimeField } from "@/features/branches/components/branch-time-field";
import type {
  BranchFormErrors,
  BranchFormValues,
} from "@/features/branches/types/branch-form.types";

type BranchPrimaryFieldsProps = {
  errors: BranchFormErrors;
  onBlurName: (name: keyof BranchFormValues) => void;
  onChange: (name: keyof BranchFormValues, value: string | boolean) => void;
  register: UseFormRegister<BranchFormValues>;
  values: BranchFormValues;
};

// Required branch identity, contact, and working-hour fields.
export function BranchPrimaryFields({
  errors,
  onBlurName,
  onChange,
  register,
  values,
}: BranchPrimaryFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <BranchTextField
        errors={errors}
        label="Hindi name"
        name="nameHi"
        onBlur={onBlurName}
        onChange={onChange}
        placeholder="निकहार्ता रूप"
        registration={register("nameHi")}
        required
        value={values.nameHi}
      />
      <BranchTextField
        errors={errors}
        label="English name"
        name="nameEn"
        onBlur={onBlurName}
        onChange={onChange}
        placeholder="Nikharta Roop"
        registration={register("nameEn")}
        value={values.nameEn}
      />
      <BranchTextField
        errors={errors}
        label="City"
        name="city"
        onChange={onChange}
        placeholder="Gurgaon"
        registration={register("city")}
        required
        value={values.city}
      />
      <BranchTextField
        errors={errors}
        label="Phone"
        name="phone"
        onChange={onChange}
        placeholder="9876543210"
        registration={register("phone")}
        required
        value={values.phone}
      />
      <BranchTimeField
        errors={errors}
        label="Open time"
        name="openTime"
        onChange={onChange}
        registration={register("openTime")}
        value={values.openTime}
      />
      <BranchTimeField
        errors={errors}
        label="Close time"
        name="closeTime"
        onChange={onChange}
        registration={register("closeTime")}
        value={values.closeTime}
      />
    </div>
  );
}
