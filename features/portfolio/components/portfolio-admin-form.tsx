/**
 * Purpose: Client form for creating admin portfolio items.
 * Responsibilities: collect branch, optional linked resources, publish flags, ordering, and uploaded media.
 * Important notes: media is selected through the shared uploader and submitted as hidden URL fields.
 */
"use client";

import * as React from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UnsavedChangesDialog } from "@/components/ui/shared/alertbox/unsaved-changes-dialog";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import { useUnsavedChangesGuard } from "@/features/forms/hooks/use-unsaved-changes-guard";
import { MediaUploaderDialog } from "@/features/media/components/media-uploader-dialog";
import type { PortfolioActionState } from "@/features/portfolio/actions/portfolio-admin.actions";
import type { PortfolioRelationOption } from "@/features/portfolio/types/portfolio.types";
import { useServiceImageUpload } from "@/features/services/components/use-service-image-upload";

type PortfolioAdminFormProps = {
  action: (
    previousState: PortfolioActionState,
    formData: FormData,
  ) => Promise<PortfolioActionState>;
  branches: PublicBranch[];
  packages: PortfolioRelationOption[];
  services: PortfolioRelationOption[];
  staff: PortfolioRelationOption[];
};

/**
 * Renders a branch-scoped portfolio create form.
 */
export function PortfolioAdminForm({
  action,
  branches,
  packages,
  services,
  staff,
}: PortfolioAdminFormProps) {
  const [formState, dispatch] = React.useReducer(
    portfolioFormReducer,
    branches,
    createInitialPortfolioFormState,
  );
  const [isPending, startTransition] = React.useTransition();
  const guard = useUnsavedChangesGuard(formState.isDirty && !isPending);
  const visibleServices = filterOptionsByBranch(services, formState.branchId);
  const visiblePackages = filterOptionsByBranch(packages, formState.branchId);
  const visibleStaff = filterOptionsByBranch(staff, formState.branchId);

  /**
   * Sends the collected portfolio form data to the server action.
   */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      dispatch({
        result: await action(formState.result, formData),
        type: "setResult",
      });
    });
  }

  /**
   * Marks uncontrolled text edits as dirty for navigation protection.
   */
  function handleFieldChange() {
    dispatch({ type: "setDirty" });
  }

  /**
   * Changes branch scope and clears relation choices from the previous branch.
   */
  function handleBranchChange(nextBranchId: string) {
    dispatch({ branchId: nextBranchId, type: "setBranch" });
  }

  /**
   * Keeps toggle state controlled so the dirty guard can react immediately.
   */
  function handlePublishedChange(nextIsPublished: boolean) {
    dispatch({ isPublished: nextIsPublished, type: "setPublished" });
  }

  /**
   * Keeps featured state controlled so the submitted value matches the UI.
   */
  function handleFeaturedChange(nextIsFeatured: boolean) {
    dispatch({ isFeatured: nextIsFeatured, type: "setFeatured" });
  }

  return (
    <form
      className="grid gap-5"
      noValidate
      onChangeCapture={handleFieldChange}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field htmlFor="branchId" label="Branch">
          <Select
            name="branchId"
            onValueChange={handleBranchChange}
            value={formState.branchId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.nameHi}, {branch.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field htmlFor="titleHi" label="Title">
          <Input id="titleHi" name="titleHi" placeholder="Bridal makeup transformation" />
        </Field>

        <RelationSelect
          label="Service"
          name="serviceId"
          onChange={(nextServiceId) => {
            dispatch({ serviceId: nextServiceId, type: "setService" });
          }}
          options={visibleServices}
          value={formState.serviceId}
        />

        <RelationSelect
          label="Package"
          name="packageId"
          onChange={(nextPackageId) => {
            dispatch({ packageId: nextPackageId, type: "setPackage" });
          }}
          options={visiblePackages}
          value={formState.packageId}
        />

        <RelationSelect
          label="Staff"
          name="staffId"
          onChange={(nextStaffId) => {
            dispatch({ staffId: nextStaffId, type: "setStaff" });
          }}
          options={visibleStaff}
          value={formState.staffId}
        />

        <Field htmlFor="sortOrder" label="Sort order">
          <Input
            id="sortOrder"
            inputMode="numeric"
            min={0}
            name="sortOrder"
            placeholder="0"
            type="number"
          />
        </Field>
      </div>

      <Field htmlFor="descriptionHi" label="Description">
        <Textarea
          id="descriptionHi"
          name="descriptionHi"
          placeholder="Short note about this portfolio work"
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-3">
        <PortfolioImagePicker
          fieldName="imageUrls"
          label="Gallery image"
          onDirty={() => dispatch({ type: "setDirty" })}
        />
        <PortfolioImagePicker
          fieldName="beforeImageUrl"
          label="Before image"
          onDirty={() => dispatch({ type: "setDirty" })}
        />
        <PortfolioImagePicker
          fieldName="afterImageUrl"
          label="After image"
          onDirty={() => dispatch({ type: "setDirty" })}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SwitchField
          checked={formState.isPublished}
          description="Published items appear in the public portfolio gallery."
          label="Published"
          name="isPublished"
          onCheckedChange={handlePublishedChange}
        />
        <SwitchField
          checked={formState.isFeatured}
          description="Featured items are sorted first in gallery lists."
          label="Featured"
          name="isFeatured"
          onCheckedChange={handleFeaturedChange}
        />
      </div>

      {formState.result.message ? (
        <p className="text-sm text-destructive">{formState.result.message}</p>
      ) : null}

      <Button disabled={isPending || !formState.branchId} type="submit">
        {isPending ? "Creating..." : "Create portfolio item"}
      </Button>
      <UnsavedChangesDialog
        onDiscard={guard.discardChanges}
        onOpenChange={guard.setIsDialogOpen}
        open={guard.isDialogOpen}
      />
    </form>
  );
}

type PortfolioFormState = {
  branchId: string;
  isDirty: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  packageId: string;
  result: PortfolioActionState;
  serviceId: string;
  staffId: string;
};

type PortfolioFormAction =
  | { branchId: string; type: "setBranch" }
  | { isFeatured: boolean; type: "setFeatured" }
  | { isPublished: boolean; type: "setPublished" }
  | { packageId: string; type: "setPackage" }
  | { result: PortfolioActionState; type: "setResult" }
  | { serviceId: string; type: "setService" }
  | { staffId: string; type: "setStaff" }
  | { type: "setDirty" };

/**
 * Seeds form state with the first available branch so create flow can start quickly.
 */
function createInitialPortfolioFormState(branches: PublicBranch[]): PortfolioFormState {
  return {
    branchId: branches[0]?.id ?? "",
    isDirty: false,
    isFeatured: false,
    isPublished: true,
    packageId: "none",
    result: {
      message: "",
      success: false,
    },
    serviceId: "none",
    staffId: "none",
  };
}

/**
 * Groups related portfolio form state so React Doctor does not flag scattered state.
 */
function portfolioFormReducer(
  state: PortfolioFormState,
  action: PortfolioFormAction,
): PortfolioFormState {
  switch (action.type) {
    case "setBranch":
      return {
        ...state,
        branchId: action.branchId,
        isDirty: true,
        packageId: "none",
        serviceId: "none",
        staffId: "none",
      };
    case "setDirty":
      return { ...state, isDirty: true };
    case "setFeatured":
      return { ...state, isDirty: true, isFeatured: action.isFeatured };
    case "setPackage":
      return { ...state, isDirty: true, packageId: action.packageId };
    case "setPublished":
      return { ...state, isDirty: true, isPublished: action.isPublished };
    case "setResult":
      return { ...state, result: action.result };
    case "setService":
      return { ...state, isDirty: true, serviceId: action.serviceId };
    case "setStaff":
      return { ...state, isDirty: true, staffId: action.staffId };
    default:
      return state;
  }
}

type RelationSelectProps = {
  label: string;
  name: string;
  onChange: (value: string) => void;
  options: PortfolioRelationOption[];
  value: string;
};

/**
 * Renders an optional branch-scoped relation select with a hidden nullable value.
 */
function RelationSelect({
  label,
  name,
  onChange,
  options,
  value,
}: RelationSelectProps) {
  return (
    <Field htmlFor={name} label={label}>
      <input name={name} type="hidden" value={value === "none" ? "" : value} />
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No {label.toLowerCase()} link</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

type PortfolioImagePickerProps = {
  fieldName: "afterImageUrl" | "beforeImageUrl" | "imageUrls";
  label: string;
  onDirty: () => void;
};

/**
 * Connects one portfolio image slot to the reusable media uploader.
 */
function PortfolioImagePicker({
  fieldName,
  label,
  onDirty,
}: PortfolioImagePickerProps) {
  const [imageUrl, setImageUrl] = React.useState("");
  const media = useServiceImageUpload(null, (nextImageUrl) => {
    setImageUrl(nextImageUrl);
    onDirty();
  });
  const shouldSubmitEmptyField = fieldName !== "imageUrls";

  return (
    <Field htmlFor={fieldName} label={label}>
      {imageUrl || shouldSubmitEmptyField ? (
        <input id={fieldName} name={fieldName} type="hidden" value={imageUrl} />
      ) : null}
      <div className="grid gap-3 rounded-md border bg-white p-3">
        {media.previewUrl ? (
          <Image
            alt={`Selected ${label.toLowerCase()}`}
            className="h-36 w-full rounded-md object-cover"
            height={144}
            src={media.previewUrl}
            width={320}
          />
        ) : (
          <div className="flex h-36 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
            No image selected
          </div>
        )}
        <MediaUploaderDialog
          accept="image/jpeg,image/png,image/webp"
          buttonLabel="Upload or choose"
          description="Upload a portfolio image or reuse existing media."
          helperText="JPG, PNG, or WebP up to 4MB."
          initialItems={media.initialItems}
          onOpen={media.loadServiceImageItems}
          onSelect={media.selectServiceImage}
          onUpload={media.uploadServiceImage}
          selectedUrl={media.previewUrl}
          title={label}
        />
      </div>
    </Field>
  );
}

type SwitchFieldProps = {
  checked: boolean;
  description: string;
  label: string;
  name: string;
  onCheckedChange: (checked: boolean) => void;
};

/**
 * Keeps portfolio boolean settings visually consistent.
 */
function SwitchField({
  checked,
  description,
  label,
  name,
  onCheckedChange,
}: SwitchFieldProps) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
      <div>
        <Label htmlFor={name}>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        id={name}
        name={name}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

type FieldProps = {
  children: React.ReactNode;
  htmlFor: string;
  label: string;
};

/**
 * Keeps label spacing consistent across the portfolio form.
 */
function Field({ children, htmlFor, label }: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

/**
 * Filters relation options so cross-branch IDs are not submitted accidentally.
 */
function filterOptionsByBranch(options: PortfolioRelationOption[], branchId: string) {
  return options.filter((option) => option.branchId === branchId);
}
