/**
 * Purpose: Client form shell for creating admin packages.
 * Responsibilities: collect branch, package details, media, and initial service composition.
 * Important notes: image selection uses the shared media uploader and submits the resulting URL through a hidden field.
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
import { MediaUploaderDialog } from "@/features/media/components/media-uploader-dialog";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import type { PackageActionState } from "@/features/packages/actions/package-admin.actions";
import type { PackageServiceOption } from "@/features/packages/types/package.types";
import { useServiceImageUpload } from "@/features/services/components/use-service-image-upload";
import { useUnsavedChangesGuard } from "@/features/forms/hooks/use-unsaved-changes-guard";

type PackageAdminFormProps = {
  action: (
    previousState: PackageActionState,
    formData: FormData,
  ) => Promise<PackageActionState>;
  branches: PublicBranch[];
  serviceOptions: PackageServiceOption[];
};

/**
 * Renders the package create form with branch-scoped service choices.
 */
export function PackageAdminForm({
  action,
  branches,
  serviceOptions,
}: PackageAdminFormProps) {
  const [state, setState] = React.useState<PackageActionState>({
    message: "",
    success: false,
  });
  const [isPending, startTransition] = React.useTransition();
  const [isDirty, setIsDirty] = React.useState(false);
  const [branchId, setBranchId] = React.useState(branches[0]?.id ?? "");
  const [isActive, setIsActive] = React.useState(true);
  const imageUrlRef = React.useRef<HTMLInputElement>(null);
  const media = useServiceImageUpload(null, (imageUrl) => {
    if (imageUrlRef.current) imageUrlRef.current.value = imageUrl;
    setIsDirty(true);
  });
  const guard = useUnsavedChangesGuard(isDirty && !isPending);
  const visibleServices = serviceOptions.filter(
    (service) => service.branchId === branchId,
  );

  /**
   * Sends form data to the API-backed server action.
   */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setState(await action(state, formData));
    });
  }

  /**
   * Marks uncontrolled input edits as unsaved changes.
   */
  function handleFieldChange() {
    setIsDirty(true);
  }

  /**
   * Updates branch scope and enables the unsaved changes prompt.
   */
  function handleBranchChange(nextBranchId: string) {
    setIsDirty(true);
    setBranchId(nextBranchId);
  }

  /**
   * Updates active status and enables the unsaved changes prompt.
   */
  function handleActiveChange(nextIsActive: boolean) {
    setIsDirty(true);
    setIsActive(nextIsActive);
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
          <Select name="branchId" onValueChange={handleBranchChange} value={branchId}>
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

        <Field htmlFor="nameHi" label="Hindi name">
          <Input id="nameHi" name="nameHi" placeholder="Bridal glow package" required />
        </Field>

        <Field htmlFor="nameEn" label="English name">
          <Input id="nameEn" name="nameEn" placeholder="Bridal Glow Package" />
        </Field>

        <Field htmlFor="slug" label="Slug">
          <Input id="slug" name="slug" placeholder="bridal-glow-package" required />
        </Field>

        <Field htmlFor="price" label="Price">
          <Input id="price" inputMode="decimal" name="price" required type="number" />
        </Field>

        <Field htmlFor="advanceAmount" label="Advance amount">
          <Input id="advanceAmount" inputMode="decimal" name="advanceAmount" type="number" />
        </Field>

        <Field htmlFor="durationMinutes" label="Duration minutes">
          <Input id="durationMinutes" inputMode="numeric" name="durationMinutes" type="number" />
        </Field>
      </div>

      <Field htmlFor="serviceIds" label="Package services">
        {visibleServices.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {visibleServices.map((service) => (
              <label
                className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm"
                key={service.id}
              >
                <input name="serviceIds" type="checkbox" value={service.id} />
                {service.nameHi}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No active services are available for this branch yet.
          </p>
        )}
      </Field>

      <Field htmlFor="descriptionHi" label="Hindi description">
        <Textarea id="descriptionHi" name="descriptionHi" placeholder="Package details" />
      </Field>

      <Field htmlFor="descriptionEn" label="English description">
        <Textarea id="descriptionEn" name="descriptionEn" placeholder="Short English description" />
      </Field>

      <Field htmlFor="imageUrl" label="Package image">
        <input id="imageUrl" name="imageUrl" ref={imageUrlRef} type="hidden" />
        <div className="flex flex-col gap-3 rounded-md border bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {media.previewUrl ? (
              <Image
                alt="Selected package"
                className="h-16 w-20 rounded-md object-cover"
                height={64}
                src={media.previewUrl}
                width={80}
              />
            ) : (
              <div className="flex h-16 w-20 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                No image
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Upload or choose a catalog image from media library.
            </p>
          </div>
          <MediaUploaderDialog
            accept="image/jpeg,image/png,image/webp"
            buttonLabel="Upload or choose image"
            description="Upload a package image or reuse an existing catalog image."
            helperText="JPG, PNG, or WebP up to 4MB."
            initialItems={media.initialItems}
            onOpen={media.loadServiceImageItems}
            onSelect={media.selectServiceImage}
            onUpload={media.uploadServiceImage}
            selectedUrl={media.previewUrl}
            title="Package media"
          />
        </div>
      </Field>

      <div className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
        <div>
          <Label htmlFor="isActive">Active</Label>
          <p className="text-xs text-muted-foreground">
            Active packages appear in customer package discovery.
          </p>
        </div>
        <Switch
          checked={isActive}
          id="isActive"
          name="isActive"
          onCheckedChange={handleActiveChange}
        />
      </div>

      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}

      <Button disabled={isPending || !branchId} type="submit">
        {isPending ? "Creating..." : "Create package"}
      </Button>
      <UnsavedChangesDialog
        onDiscard={guard.discardChanges}
        onOpenChange={guard.setIsDialogOpen}
        open={guard.isDialogOpen}
      />
    </form>
  );
}

type FieldProps = {
  children: React.ReactNode;
  htmlFor: string;
  label: string;
};

/**
 * Keeps label/input spacing consistent across the package form.
 */
function Field({ children, htmlFor, label }: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
