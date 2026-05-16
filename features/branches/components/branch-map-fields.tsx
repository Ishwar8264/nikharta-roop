import type { UseFormRegister } from "react-hook-form";

import { BranchTextField } from "@/features/branches/components/branch-text-field";
import type {
  BranchFormErrors,
  BranchFormValues,
} from "@/features/branches/types/branch-form.types";

type BranchMapFieldsProps = {
  errors: BranchFormErrors;
  onChange: (name: keyof BranchFormValues, value: string | boolean) => void;
  register: UseFormRegister<BranchFormValues>;
  values: BranchFormValues;
};

// Optional map fields stay grouped because they validate together.
export function BranchMapFields({
  errors,
  onChange,
  register,
  values,
}: BranchMapFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <BranchTextField
        errors={errors}
        label="Google Maps URL"
        name="googleMapsUrl"
        onChange={onChange}
        placeholder="https://maps.google.com/..."
        registration={register("googleMapsUrl")}
        value={values.googleMapsUrl}
      />
      <BranchTextField
        errors={errors}
        label="Google place id"
        name="placeId"
        onChange={onChange}
        placeholder="ChIJ..."
        registration={register("placeId")}
        value={values.placeId}
      />
      <BranchTextField
        errors={errors}
        label="Latitude"
        name="latitude"
        onChange={onChange}
        placeholder="28.4595"
        registration={register("latitude")}
        type="number"
        value={values.latitude}
      />
      <BranchTextField
        errors={errors}
        label="Longitude"
        name="longitude"
        onChange={onChange}
        placeholder="77.0266"
        registration={register("longitude")}
        type="number"
        value={values.longitude}
      />
    </div>
  );
}
