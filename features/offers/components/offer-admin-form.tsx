/**
 * Purpose: Client form shell for creating admin offers.
 * Responsibilities: collect branch scope, coupon details, validity, limits, and optional service restrictions.
 * Important notes: service restrictions are filtered by branch; global offers can be created without service restrictions.
 */
"use client";

import { DiscountType } from "@prisma/client";
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
import { UnsavedChangesDialog } from "@/components/ui/shared/alertbox/unsaved-changes-dialog";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import type { OfferActionState } from "@/features/offers/actions/offer-admin.actions";
import type { OfferServiceOption } from "@/features/offers/types/offer.types";
import { useUnsavedChangesGuard } from "@/features/forms/hooks/use-unsaved-changes-guard";

type OfferAdminFormProps = {
  action: (
    previousState: OfferActionState,
    formData: FormData,
  ) => Promise<OfferActionState>;
  branches: PublicBranch[];
  serviceOptions: OfferServiceOption[];
};

/**
 * Renders the offer create form with optional service restrictions.
 */
export function OfferAdminForm({
  action,
  branches,
  serviceOptions,
}: OfferAdminFormProps) {
  const [state, setState] = React.useState<OfferActionState>({
    message: "",
    success: false,
  });
  const [isPending, startTransition] = React.useTransition();
  const [isDirty, setIsDirty] = React.useState(false);
  const [branchId, setBranchId] = React.useState("global");
  const [isActive, setIsActive] = React.useState(true);
  const guard = useUnsavedChangesGuard(isDirty && !isPending);
  const visibleServices =
    branchId === "global"
      ? serviceOptions
      : serviceOptions.filter((service) => service.branchId === branchId);

  /**
   * Sends form data to the API-backed server action.
   */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (branchId === "global") {
      formData.set("branchId", "");
    }

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
        <Field htmlFor="branchId" label="Branch scope">
          <Select name="branchId" onValueChange={handleBranchChange} value={branchId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">All branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.nameHi}, {branch.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field htmlFor="code" label="Coupon code">
          <Input id="code" name="code" placeholder="GLOW20" required />
        </Field>

        <Field htmlFor="titleHi" label="Hindi title">
          <Input id="titleHi" name="titleHi" placeholder="ग्लो ऑफर" required />
        </Field>

        <Field htmlFor="titleEn" label="English title">
          <Input id="titleEn" name="titleEn" placeholder="Glow Offer" />
        </Field>

        <Field htmlFor="discountType" label="Discount type">
          <select
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            defaultValue={DiscountType.PERCENTAGE}
            id="discountType"
            name="discountType"
          >
            <option value={DiscountType.PERCENTAGE}>Percentage</option>
            <option value={DiscountType.FLAT_AMOUNT}>Flat amount</option>
          </select>
        </Field>

        <Field htmlFor="discountValue" label="Discount value">
          <Input id="discountValue" inputMode="decimal" name="discountValue" required type="number" />
        </Field>

        <Field htmlFor="minOrder" label="Minimum order">
          <Input id="minOrder" inputMode="decimal" name="minOrder" type="number" />
        </Field>

        <Field htmlFor="maxDiscount" label="Max discount">
          <Input id="maxDiscount" inputMode="decimal" name="maxDiscount" type="number" />
        </Field>

        <Field htmlFor="usageLimit" label="Usage limit">
          <Input id="usageLimit" inputMode="numeric" name="usageLimit" type="number" />
        </Field>

        <Field htmlFor="perUserLimit" label="Per-user limit">
          <Input id="perUserLimit" inputMode="numeric" name="perUserLimit" type="number" />
        </Field>

        <Field htmlFor="validFrom" label="Valid from">
          <Input id="validFrom" name="validFrom" required type="datetime-local" />
        </Field>

        <Field htmlFor="validUntil" label="Valid until">
          <Input id="validUntil" name="validUntil" required type="datetime-local" />
        </Field>
      </div>

      <Field htmlFor="serviceIds" label="Restricted services">
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
        <Textarea id="descriptionHi" name="descriptionHi" placeholder="Offer details" />
      </Field>

      <div className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
        <div>
          <Label htmlFor="isActive">Active</Label>
          <p className="text-xs text-muted-foreground">
            Active offers appear in customer offer discovery.
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

      <Button disabled={isPending} type="submit">
        {isPending ? "Creating..." : "Create offer"}
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
 * Keeps label/input spacing consistent across the offer form.
 */
function Field({ children, htmlFor, label }: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
