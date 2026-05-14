import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BranchFieldError } from "@/features/branches/components/branch-field-error";
import { BranchTextField } from "@/features/branches/components/branch-text-field";
import type {
  BranchFormErrors,
  BranchFormValues,
} from "@/features/branches/types/branch-form.types";

type BranchFormFieldsProps = {
  errors: BranchFormErrors;
  onChange: (name: keyof BranchFormValues, value: string | boolean) => void;
  values: BranchFormValues;
};

// Shared branch inputs keep create and edit forms aligned.
export function BranchFormFields({
  errors,
  onChange,
  values,
}: BranchFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <BranchTextField errors={errors} label="Hindi name" name="nameHi" onChange={onChange} required value={values.nameHi} />
        <BranchTextField errors={errors} label="English name" name="nameEn" onChange={onChange} value={values.nameEn} />
        <BranchTextField errors={errors} label="City" name="city" onChange={onChange} required value={values.city} />
        <BranchTextField errors={errors} label="Phone" name="phone" onChange={onChange} required value={values.phone} />
        <BranchTextField
          errors={errors}
          label="Open time"
          name="openTime"
          onChange={onChange}
          required
          type="time"
          value={values.openTime}
        />
        <BranchTextField
          errors={errors}
          label="Close time"
          name="closeTime"
          onChange={onChange}
          required
          type="time"
          value={values.closeTime}
        />
      </div>

      <label className="grid gap-1.5 text-sm font-medium">
        Address
        <Textarea
          className="min-h-24 bg-white"
          aria-describedby={errors.address ? "address-error" : undefined}
          aria-invalid={Boolean(errors.address)}
          name="address"
          onChange={(event) => onChange("address", event.currentTarget.value)}
          required
          value={values.address}
        />
        <BranchFieldError id="address-error" message={errors.address} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <BranchTextField errors={errors} label="Google Maps URL" name="googleMapsUrl" onChange={onChange} value={values.googleMapsUrl} />
        <BranchTextField errors={errors} label="Google place id" name="placeId" onChange={onChange} value={values.placeId} />
        <BranchTextField errors={errors} label="Latitude" name="latitude" onChange={onChange} type="number" value={values.latitude} />
        <BranchTextField errors={errors} label="Longitude" name="longitude" onChange={onChange} type="number" value={values.longitude} />
      </div>

      <Label className="justify-between rounded-xl border bg-white p-3">
        <span>
          <span className="block">Active branch</span>
          <span className="text-xs font-normal text-muted-foreground">
            Active branches appear on public booking and discovery screens.
          </span>
        </span>
        <Switch
          checked={values.isActive}
          name="isActive"
          onCheckedChange={(checked) => onChange("isActive", checked)}
        />
      </Label>
    </div>
  );
}
