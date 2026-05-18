/**
 * Purpose: Client form shell for creating service categories.
 * Responsibilities: collect branch scope, category names, slug, sort order, and active state.
 * Important notes: categories are required before services because each service belongs to one category.
 */
"use client";

import * as React from "react";

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
import type { PublicBranch } from "@/features/branches/types/branch.types";
import type { ServiceActionState } from "@/features/services/actions/service-admin.actions";

type ServiceCategoryFormShellProps = {
  action: (
    previousState: ServiceActionState,
    formData: FormData,
  ) => Promise<ServiceActionState>;
  branches: PublicBranch[];
};

/**
 * Renders the category create form used before service creation.
 */
export function ServiceCategoryFormShell({
  action,
  branches,
}: ServiceCategoryFormShellProps) {
  const [state, setState] = React.useState<ServiceActionState>({
    message: "",
    success: false,
  });
  const [isPending, startTransition] = React.useTransition();
  const [branchId, setBranchId] = React.useState(branches[0]?.id ?? "");
  const [isActive, setIsActive] = React.useState(true);

  /**
   * Sends category data to the API-backed server action.
   */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setState(await action(state, formData));
    });
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field htmlFor="branchId" label="Branch">
          <Select name="branchId" onValueChange={setBranchId} value={branchId}>
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

        <Field htmlFor="sortOrder" label="Sort order">
          <Input
            id="sortOrder"
            inputMode="numeric"
            name="sortOrder"
            placeholder="0"
            type="number"
          />
        </Field>

        <Field htmlFor="nameHi" label="Hindi name">
          <Input id="nameHi" name="nameHi" placeholder="फेशियल" required />
        </Field>

        <Field htmlFor="nameEn" label="English name">
          <Input id="nameEn" name="nameEn" placeholder="Facial" required />
        </Field>

        <Field htmlFor="slug" label="Slug">
          <Input id="slug" name="slug" placeholder="facial" required />
        </Field>
      </div>

      <Field htmlFor="description" label="Description">
        <Textarea
          id="description"
          name="description"
          placeholder="Short category description"
        />
      </Field>

      <div className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
        <div>
          <Label htmlFor="isActive">Active</Label>
          <p className="text-xs text-muted-foreground">
            Active categories appear in service creation and public filters.
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

      <Button disabled={isPending || !branchId} type="submit">
        {isPending ? "Creating..." : "Create category"}
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
 * Keeps category form fields visually consistent.
 */
function Field({ children, htmlFor, label }: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
