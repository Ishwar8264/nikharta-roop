/**
 * Purpose: Client form shell for creating admin service records.
 * Responsibilities: collect branch/category/service details and call the supplied server action.
 * Important notes: category options update with the selected branch while API validation remains authoritative.
 */
"use client";

import * as React from "react";
import Link from "next/link";

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
import { MediaUploaderDialog } from "@/features/media/components/media-uploader-dialog";
import type { ServiceActionState } from "@/features/services/actions/service-admin.actions";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import { useServiceImageUpload } from "@/features/services/components/use-service-image-upload";
import type { PublicServiceCategory } from "@/features/services/types/service.types";

type ServiceFormShellProps = {
  action: (
    previousState: ServiceActionState,
    formData: FormData,
  ) => Promise<ServiceActionState>;
  branches: PublicBranch[];
  categoriesByBranch: Record<string, PublicServiceCategory[]>;
};

/**
 * Renders a service create form with controlled branch/category selectors.
 */
export function ServiceFormShell({
  action,
  branches,
  categoriesByBranch,
}: ServiceFormShellProps) {
  const [state, setState] = React.useState<ServiceActionState>({
    message: "",
    success: false,
  });
  const [isPending, startTransition] = React.useTransition();
  const initialBranchId = branches[0]?.id ?? "";
  const [branchId, setBranchId] = React.useState(initialBranchId);
  const [categoryId, setCategoryId] = React.useState(
    categoriesByBranch[initialBranchId]?.[0]?.id ?? "",
  );
  const [isActive, setIsActive] = React.useState(true);
  const imageUrlRef = React.useRef<HTMLInputElement>(null);
  const media = useServiceImageUpload(null, (imageUrl) => {
    if (imageUrlRef.current) imageUrlRef.current.value = imageUrl;
  });
  const categories = categoriesByBranch[branchId] ?? [];

  /**
   * Sends FormData to the server action while preserving inline API errors.
   */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setState(await action(state, formData));
    });
  }

  /**
   * Switches branch and chooses the first valid category for that branch.
   */
  function handleBranchChange(nextBranchId: string) {
    setBranchId(nextBranchId);
    setCategoryId(categoriesByBranch[nextBranchId]?.[0]?.id ?? "");
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Branch" htmlFor="branchId">
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

        <Field label="Category" htmlFor="categoryId">
          <Select
            disabled={categories.length === 0}
            name="categoryId"
            onValueChange={setCategoryId}
            value={categoryId}
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
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Selected service"
                className="h-16 w-20 rounded-md object-cover"
                src={media.previewUrl}
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
          checked={isActive}
          id="isActive"
          name="isActive"
          onCheckedChange={setIsActive}
        />
      </div>

      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}

      <Button disabled={isPending || !branchId || !categoryId} type="submit">
        {isPending ? "Creating..." : "Create service"}
      </Button>
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
