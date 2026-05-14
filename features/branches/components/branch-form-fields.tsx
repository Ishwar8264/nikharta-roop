import type { UseFormRegister } from "react-hook-form";

import { BranchActiveField } from "@/features/branches/components/branch-active-field";
import { BranchAddressField } from "@/features/branches/components/branch-address-field";
import { BranchMapFields } from "@/features/branches/components/branch-map-fields";
import { BranchPrimaryFields } from "@/features/branches/components/branch-primary-fields";
import type {
  BranchFormErrors,
  BranchFormValues,
} from "@/features/branches/types/branch-form.types";

type BranchFormFieldsProps = {
  errors: BranchFormErrors;
  onBlurName: (name: keyof BranchFormValues) => void;
  onChange: (name: keyof BranchFormValues, value: string | boolean) => void;
  register: UseFormRegister<BranchFormValues>;
  values: BranchFormValues;
};

// Shared branch inputs keep create and edit forms aligned.
export function BranchFormFields({
  errors,
  onBlurName,
  onChange,
  register,
  values,
}: BranchFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <BranchPrimaryFields
        errors={errors}
        onBlurName={onBlurName}
        onChange={onChange}
        register={register}
        values={values}
      />

      <BranchAddressField
        error={errors.address}
        onChange={(value) => onChange("address", value)}
        registration={register("address")}
        value={values.address}
      />

      <BranchMapFields
        errors={errors}
        onChange={onChange}
        register={register}
        values={values}
      />

      <BranchActiveField
        onChange={(checked) => onChange("isActive", checked)}
        value={values.isActive}
      />
    </div>
  );
}
