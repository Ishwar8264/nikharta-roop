"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  Receipt,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/features/auth/shared/components/field";
import { FormError } from "@/features/auth/shared/components/form-error";
import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

import { createCouponApi, updateCouponApi } from "./api";
import {
  buildDiscountSummary,
  couponFormSchema,
  toDatetimeLocal,
  toIsoWithOffset,
  type CouponFormInput,
  type CouponFormValues,
} from "./schemas";
import type { CouponView, DiscountType } from "./types";

interface CouponFormProps {
  salonSlug: string;
  /** When present, the form is in edit mode — `code` becomes read-only. */
  initial?: CouponView;
  onSaved: () => void;
  onCancel: () => void;
}

const DISCOUNT_OPTIONS: Array<{ value: DiscountType; label: string; hint: string }> = [
  { value: "PERCENTAGE", label: "Percentage", hint: "e.g. 20% off" },
  { value: "FLAT", label: "Flat amount", hint: "e.g. ₹200 off" },
];

/** Maps an API failure to form-level and field-level errors. */
function useApiError() {
  const [message, setMessage] = useState<string | null>(null);
  function show(caught: unknown) {
    if (caught instanceof ApiError) {
      setMessage(caught.message);
      const payload = caught.data as {
        errors?: Array<{ field: string; message: string }>;
      } | null;
      return payload?.errors ?? [];
    }
    setMessage("Something went wrong. Please try again.");
    return [];
  }
  return { message, setMessage, show };
}

/**
 * Create or edit a salon coupon. Lives inside a Dialog on the manage page —
 * `onSaved` lets the parent close the dialog and refresh the server list.
 *
 * The `code` field auto-uppercases on type (matching the server's normalize
 * step) and is read-only in edit mode because the schema marks it immutable.
 */
export function CouponForm({
  salonSlug,
  initial,
  onSaved,
  onCancel,
}: CouponFormProps) {
  const apiError = useApiError();
  const [busy, setBusy] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<CouponFormInput, unknown, CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: initial
      ? {
          code: initial.code,
          description: initial.description ?? undefined,
          discountType: initial.discountType,
          discountValue: initial.discountValue,
          minOrderAmount: initial.minOrderAmount ?? undefined,
          maxDiscount: initial.maxDiscount ?? undefined,
          usageLimit: initial.usageLimit ?? undefined,
          perUserLimit: initial.perUserLimit,
          validFrom: toDatetimeLocal(initial.validFrom),
          validUntil: toDatetimeLocal(initial.validUntil),
          isActive: initial.isActive,
        }
      : {
          code: "",
          discountType: "PERCENTAGE",
          discountValue: 0,
          perUserLimit: 1,
          validFrom: "",
          validUntil: "",
          isActive: true,
        },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const code = useWatch({ control, name: "code" }) ?? "";
  const discountType = useWatch({ control, name: "discountType" });
  const discountValue = useWatch({ control, name: "discountValue" }) ?? 0;
  const minOrderAmount = useWatch({ control, name: "minOrderAmount" });
  const maxDiscount = useWatch({ control, name: "maxDiscount" });
  const validFrom = useWatch({ control, name: "validFrom" }) ?? "";
  const validUntil = useWatch({ control, name: "validUntil" }) ?? "";

  // Keep the code field uppercased as the user types — the server does the
  // same in its `couponCodeSchema` transform, so the preview matches what will
  // be stored.
  useEffect(() => {
    if (!initial) {
      const upper = code.toUpperCase();
      if (upper !== code) setValue("code", upper, { shouldDirty: false });
    }
  }, [code, initial, setValue]);

  const summary = useMemo(
    () =>
      buildDiscountSummary({
        discountType,
        discountValue: typeof discountValue === "number" ? discountValue : 0,
        minOrderAmount:
          typeof minOrderAmount === "number" ? minOrderAmount : null,
        maxDiscount: typeof maxDiscount === "number" ? maxDiscount : null,
      }),
    [discountType, discountValue, minOrderAmount, maxDiscount],
  );

  const showQuickFill = !validFrom && !validUntil && !initial;

  /** Pre-fills the validity window with now → now + 30 days. */
  function fillNext30Days() {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    setValue("validFrom", toDatetimeLocal(now.toISOString()), {
      shouldDirty: true,
    });
    setValue("validUntil", toDatetimeLocal(end.toISOString()), {
      shouldDirty: true,
    });
  }

  async function submit(values: CouponFormValues) {
    apiError.setMessage(null);
    setBusy(true);
    try {
      const validFrom = toIsoWithOffset(values.validFrom);
      const validUntil = toIsoWithOffset(values.validUntil);

      if (initial) {
        const body = {
          description: values.description ?? null,
          discountType: values.discountType,
          discountValue: values.discountValue,
          minOrderAmount: values.minOrderAmount ?? null,
          maxDiscount:
            values.discountType === "PERCENTAGE"
              ? (values.maxDiscount ?? null)
              : null,
          usageLimit: values.usageLimit ?? null,
          perUserLimit: values.perUserLimit,
          validFrom,
          validUntil,
          isActive: values.isActive,
        };
        await updateCouponApi(salonSlug, initial.id, body);
        toast.success(`${values.code} updated.`);
      } else {
        const body = {
          code: values.code,
          description: values.description,
          discountType: values.discountType,
          discountValue: values.discountValue,
          minOrderAmount: values.minOrderAmount,
          maxDiscount:
            values.discountType === "PERCENTAGE"
              ? values.maxDiscount
              : undefined,
          usageLimit: values.usageLimit,
          perUserLimit: values.perUserLimit,
          validFrom,
          validUntil,
          isActive: values.isActive,
        };
        await createCouponApi(salonSlug, body);
        toast.success(`${values.code} created — ready for customers.`);
      }
      onSaved();
    } catch (caught) {
      const fieldErrors = apiError.show(caught);
      for (const issue of fieldErrors) {
        if (issue.field in couponFormSchema.shape) {
          setError(issue.field as keyof CouponFormInput, {
            type: "server",
            message: issue.message,
          });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{initial ? "Edit coupon" : "New coupon"}</DialogTitle>
      </DialogHeader>

      {apiError.message ? <FormError>{apiError.message}</FormError> : null}

      <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
        <div className="space-y-1.5">
          <Field
            id="code"
            label="Coupon code"
            placeholder="e.g. GLOW20"
            disabled={busy || Boolean(initial)}
            error={errors.code?.message}
            {...register("code")}
          />
          {code ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Preview</span>
              <span
                aria-label={`Coupon code preview: ${code}`}
                className="inline-flex items-center rounded-md border border-primary/30 bg-primary/5 px-2 py-0.5 font-mono text-sm font-semibold uppercase tracking-wider text-primary"
              >
                {code}
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Letters, digits, and hyphens. We uppercase it for you.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            rows={2}
            maxLength={500}
            disabled={busy}
            placeholder="e.g. Diwali glow offer — 20% off above ₹999."
            aria-invalid={Boolean(errors.description)}
            {...register("description", {
              setValueAs: (value: string) => value || undefined,
            })}
          />
          {errors.description?.message ? (
            <p role="alert" className="text-xs text-destructive">
              {errors.description.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Discount type</Label>
          <Controller
            name="discountType"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {DISCOUNT_OPTIONS.map((option) => {
                  const selected = field.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        field.onChange(option.value as DiscountType)
                      }
                      aria-pressed={selected}
                      className={cn(
                        "relative rounded-lg border p-3 text-left transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/40 hover:bg-muted/40",
                      )}
                    >
                      <span className="block text-sm font-medium">
                        {option.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.hint}
                      </span>
                      {selected ? (
                        <CheckCircle2
                          className="absolute right-2 top-2 h-4 w-4 text-primary"
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.discountType?.message ? (
            <p role="alert" className="text-xs text-destructive">
              {errors.discountType.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="discountValue"
            label={
              discountType === "PERCENTAGE"
                ? "Discount percentage (%)"
                : "Discount amount (₹)"
            }
            type="number"
            min={1}
            step={discountType === "PERCENTAGE" ? 1 : 1}
            disabled={busy}
            error={errors.discountValue?.message}
            {...register("discountValue", { valueAsNumber: true })}
          />
          {discountType === "PERCENTAGE" ? (
            <Field
              id="maxDiscount"
              label="Max discount (₹, optional)"
              type="number"
              min={1}
              step={1}
              disabled={busy}
              error={errors.maxDiscount?.message}
              {...register("maxDiscount", {
                setValueAs: (value: string) => {
                  if (value === "" || value == null) return undefined;
                  const num = Number(value);
                  return Number.isNaN(num) ? undefined : num;
                },
              })}
            />
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="minOrderAmount"
            label="Min order amount (₹, optional)"
            type="number"
            min={0}
            step={1}
            disabled={busy}
            error={errors.minOrderAmount?.message}
            {...register("minOrderAmount", {
              setValueAs: (value: string) => {
                if (value === "" || value == null) return undefined;
                const num = Number(value);
                return Number.isNaN(num) ? undefined : num;
              },
            })}
          />
          <Field
            id="usageLimit"
            label="Total usage limit (optional)"
            type="number"
            min={1}
            step={1}
            disabled={busy}
            error={errors.usageLimit?.message}
            {...register("usageLimit", {
              setValueAs: (value: string) => {
                if (value === "" || value == null) return undefined;
                const num = Number(value);
                return Number.isNaN(num) ? undefined : num;
              },
            })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="perUserLimit"
            label="Per-customer limit"
            type="number"
            min={1}
            step={1}
            disabled={busy}
            error={errors.perUserLimit?.message}
            {...register("perUserLimit", { valueAsNumber: true })}
          />
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive coupons stop working immediately.
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                  disabled={busy}
                />
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Validity period</Label>
            {showQuickFill ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={fillNext30Days}
                className="gap-1 text-primary hover:bg-primary/5"
              >
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                Set to next 30 days
              </Button>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Field
                id="validFrom"
                label="Starts"
                type="datetime-local"
                disabled={busy}
                error={errors.validFrom?.message}
                {...register("validFrom")}
              />
            </div>
            <div className="space-y-1.5">
              <Field
                id="validUntil"
                label="Ends"
                type="datetime-local"
                disabled={busy}
                error={errors.validUntil?.message}
                {...register("validUntil")}
              />
            </div>
          </div>
        </div>

        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm"
        >
          <span className="mt-0.5 shrink-0 text-primary">
            <Receipt className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Discount preview
            </p>
            <p className="font-semibold text-foreground">{summary}</p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : initial ? (
            "Save changes"
          ) : (
            "Create coupon"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
