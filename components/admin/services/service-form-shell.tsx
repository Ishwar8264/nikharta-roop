/**
 * Purpose: Client form shell for creating admin service records.
 * Responsibilities: collect branch/category/service details and call the supplied server action.
 * Important notes: category options update with the selected branch while API validation remains authoritative.
 */
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { UnsavedChangesDialog } from "@/components/ui/shared/alertbox/unsaved-changes-dialog";
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
import { MediaUploaderDialog } from "@/features/media/components/media-uploader-dialog";
import type { ServiceActionState } from "@/features/services/actions/service-admin.actions";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import { useServiceImageUpload } from "@/features/services/components/use-service-image-upload";
import type { PublicServiceCategory } from "@/features/services/types/service.types";
import { useUnsavedChangesGuard } from "@/features/forms/hooks/use-unsaved-changes-guard";

type ServiceFormShellProps = {
  action: (
    previousState: ServiceActionState,
    formData: FormData,
  ) => Promise<ServiceActionState>;
  branches: PublicBranch[];
  categoriesByBranch: Record<string, PublicServiceCategory[]>;
};

type ServiceFormState = {
  actionState: ServiceActionState;
  branchId: string;
  categoryId: string;
  isActive: boolean;
  isDirty: boolean;
};

type ServiceFormAction =
  | { state: ServiceActionState; type: "setActionState" }
  | { type: "markDirty" }
  | { branchId: string; categoryId: string; type: "selectBranch" }
  | { categoryId: string; type: "selectCategory" }
  | { isActive: boolean; type: "setActive" };

/**
 * Builds initial reducer state from branch and category props.
 */
function createInitialServiceFormState(input: {
  branches: PublicBranch[];
  categoriesByBranch: Record<string, PublicServiceCategory[]>;
}): ServiceFormState {
  const branchId = input.branches[0]?.id ?? "";

  return {
    actionState: { message: "", success: false },
    branchId,
    categoryId: input.categoriesByBranch[branchId]?.[0]?.id ?? "",
    isActive: true,
    isDirty: false,
  };
}

/**
 * Keeps related service form state changes together for predictable updates.
 */
function serviceFormReducer(
  state: ServiceFormState,
  action: ServiceFormAction,
): ServiceFormState {
  switch (action.type) {
    case "setActionState":
      return { ...state, actionState: action.state };
    case "markDirty":
      return { ...state, isDirty: true };
    case "selectBranch":
      return {
        ...state,
        branchId: action.branchId,
        categoryId: action.categoryId,
        isDirty: true,
      };
    case "selectCategory":
      return { ...state, categoryId: action.categoryId, isDirty: true };
    case "setActive":
      return { ...state, isActive: action.isActive, isDirty: true };
  }
}

/**
 * Renders a service create form with controlled branch/category selectors.
 */
export function ServiceFormShell({
  action,
  branches,
  categoriesByBranch,
}: ServiceFormShellProps) {
  const [formState, dispatchFormState] = React.useReducer(
    serviceFormReducer,
    { branches, categoriesByBranch },
    createInitialServiceFormState,
  );
  const [isPending, startTransition] = React.useTransition();
  const imageUrlRef = React.useRef<HTMLInputElement>(null);
  const media = useServiceImageUpload(null, (imageUrl) => {
    if (imageUrlRef.current) imageUrlRef.current.value = imageUrl;
    dispatchFormState({ type: "markDirty" });
  });
  const guard = useUnsavedChangesGuard(formState.isDirty && !isPending);
  const categories = categoriesByBranch[formState.branchId] ?? [];

  /**
   * Sends FormData to the server action while preserving inline API errors.
   */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      dispatchFormState({
        state: await action(formState.actionState, formData),
        type: "setActionState",
      });
    });
  }

  /**
   * Switches branch and chooses the first valid category for that branch.
   */
  function handleBranchChange(nextBranchId: string) {
    dispatchFormState({
      branchId: nextBranchId,
      categoryId: categoriesByBranch[nextBranchId]?.[0]?.id ?? "",
      type: "selectBranch",
    });
  }

  /**
   * Marks form state dirty when users edit uncontrolled text and number fields.
   */
  function handleFieldChange() {
    dispatchFormState({ type: "markDirty" });
  }

  /**
   * Updates category selection while enabling the unsaved changes prompt.
   */
  function handleCategoryChange(nextCategoryId: string) {
    dispatchFormState({ categoryId: nextCategoryId, type: "selectCategory" });
  }

  /**
   * Updates active status while enabling the unsaved changes prompt.
   */
  function handleActiveChange(nextIsActive: boolean) {
    dispatchFormState({ isActive: nextIsActive, type: "setActive" });
  }

  return (
    <form
      className="grid gap-5"
      noValidate
      onChangeCapture={handleFieldChange}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Branch" htmlFor="branchId">
          <Select name="branchId" onValueChange={handleBranchChange} value={formState.branchId}>
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

        <Field label="Category" htmlFor="categoryId">
          <Select
            disabled={categories.length === 0}
            name="categoryId"
            onValueChange={handleCategoryChange}
            value={formState.categoryId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.nameHi}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categories.length === 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>This branch has no service category yet.</span>
              <Link className="font-medium text-rose-700" href="/admin/services/categories/new">
                Create category
              </Link>
            </div>
          ) : null}
        </Field>

        <Field label="Hindi name" htmlFor="nameHi">
          <Input id="nameHi" name="nameHi" placeholder="फेशियल" required />
        </Field>

        <Field label="English name" htmlFor="nameEn">
          <Input id="nameEn" name="nameEn" placeholder="Facial" required />
        </Field>

        <Field label="Slug" htmlFor="slug">
          <Input id="slug" name="slug" placeholder="facial" required />
        </Field>

        <Field label="Price" htmlFor="price">
          <Input
            id="price"
            inputMode="decimal"
            name="price"
            placeholder="500"
            required
            type="number"
          />
        </Field>

        <Field label="Duration minutes" htmlFor="durationMinutes">
          <Input
            id="durationMinutes"
            inputMode="numeric"
            name="durationMinutes"
            placeholder="45"
            required
            type="number"
          />
        </Field>

        <Field label="Advance amount" htmlFor="advanceAmount">
          <Input
            id="advanceAmount"
            inputMode="decimal"
            name="advanceAmount"
            placeholder="100"
            type="number"
          />
        </Field>
      </div>

      <Field label="Hindi description" htmlFor="descriptionHi">
        <Textarea
          id="descriptionHi"
          name="descriptionHi"
          placeholder="सेवा की जानकारी लिखें"
          required
        />
      </Field>

      <Field label="English description" htmlFor="descriptionEn">
        <Textarea
          id="descriptionEn"
          name="descriptionEn"
          placeholder="Write a short service description"
        />
      </Field>

      <Field label="Service image" htmlFor="imageUrl">
        <input id="imageUrl" name="imageUrl" ref={imageUrlRef} type="hidden" />
        <div className="flex flex-col gap-3 rounded-md border bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {media.previewUrl ? (
              <Image
                alt="Selected service"
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
            description="Upload a service image or reuse an existing catalog image."
            helperText="JPG, PNG, or WebP up to 4MB."
            initialItems={media.initialItems}
            onOpen={media.loadServiceImageItems}
            onSelect={media.selectServiceImage}
            onUpload={media.uploadServiceImage}
            selectedUrl={media.previewUrl}
            title="Service media"
          />
        </div>
      </Field>

      <div className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
        <div>
          <Label htmlFor="isActive">Active</Label>
          <p className="text-xs text-muted-foreground">
            Active services appear in customer service discovery.
          </p>
        </div>
        <Switch
            checked={formState.isActive}
          id="isActive"
          name="isActive"
          onCheckedChange={handleActiveChange}
        />
      </div>

      {formState.actionState.message ? (
        <p className="text-sm text-destructive">{formState.actionState.message}</p>
      ) : null}

      <Button disabled={isPending || !formState.branchId || !formState.categoryId} type="submit">
        {isPending ? "Creating..." : "Create service"}
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
 * Keeps label/input spacing consistent across the service form.
 */
function Field({ children, htmlFor, label }: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
