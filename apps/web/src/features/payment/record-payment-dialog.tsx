"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appointmentPriceFormatter } from "@/features/appointment/format";
import { ApiError } from "@/lib/api/backend.client";

import {
  newIdempotencyKey,
  recordTransactionApi,
} from "./api";
import type { PaymentMethod, PaymentTxnType } from "./types";

/**
 * Dialog form schema — mirrors the server's `createPaymentTransactionSchema`
 * (see `src/server/modules/payment/payment.schema.ts`) minus the
 * `idempotencyKey` (generated per attempt in component state) and `commission`
 * (not user-facing). Field-level errors from the server still map cleanly
 * because the keys match.
 */
const recordPaymentSchema = z.object({
  type: z.enum(["ADVANCE", "FINAL", "REFUND"], {
    error: "Type must be ADVANCE, FINAL, or REFUND",
  }),
  amount: z.coerce
    .number({ error: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .max(10_000_000, "Amount is too large"),
  method: z.enum(["UPI", "CASH", "CARD", "WALLET", "ONLINE"], {
    error: "Method is invalid",
  }),
  gatewayRef: z
    .string()
    .trim()
    .max(128, "Gateway reference is too long")
    .optional(),
});

type RecordPaymentInput = z.input<typeof recordPaymentSchema>;
type RecordPaymentValues = z.output<typeof recordPaymentSchema>;

interface RecordPaymentDialogProps {
  appointmentId: string;
  totalPrice: number;
  /**
   * Sum of ADVANCE + FINAL so far — the cap for a REFUND. The server's
   * `sumCollectedForAppointment` returns exactly this value, so we re-use the
   * parent ledger's computed `paid` total to avoid an extra fetch when the
   * dialog opens. When undefined, the cap text is hidden (the server still
   * enforces the limit and returns a 400 on overflow).
   */
  collected?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded: () => void;
}

const TYPE_OPTIONS: Array<{ value: PaymentTxnType; label: string }> = [
  { value: "ADVANCE", label: "Advance" },
  { value: "FINAL", label: "Final" },
  { value: "REFUND", label: "Refund" },
];

/**
 * Method order is UPI-first per the India-first UX principle
 * (wiring doc §2.3): UPI dominates Indian salon payments, so it sits at the
 * top of the select. Cash and Card follow; Wallet/Online are tail options.
 */
const METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "UPI", label: "UPI" },
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "WALLET", label: "Wallet" },
  { value: "ONLINE", label: "Online" },
];

const DEFAULT_VALUES: RecordPaymentInput = {
  type: "ADVANCE",
  amount: 0,
  method: "UPI",
  gatewayRef: undefined,
};

/** Records an advance/final/refund transaction with idempotent retries. */
export function RecordPaymentDialog({
  appointmentId,
  totalPrice,
  collected = 0,
  open,
  onOpenChange,
  onRecorded,
}: RecordPaymentDialogProps) {
  // One idempotency key per logical attempt. State survives re-renders so a
  // flaky network retry reuses the same key — the backend turns that into a
  // 409 ("already recorded") instead of a duplicate charge. We use state
  // (not a ref) so the lint rule about reading refs outside handlers stays
  // happy; the key is never displayed, so the extra render is a no-op.
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    newIdempotencyKey(),
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecordPaymentInput, unknown, RecordPaymentValues>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const selectedType = useWatch({ control, name: "type" });

  // Reset the form (and mint a fresh idempotency key) every time the dialog
  // opens — a closed-then-reopened dialog is a new logical attempt.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting a session-scoped key when the dialog opens is a legitimate prop-change sync; the extra render is a no-op (the key is never displayed).
      setIdempotencyKey(newIdempotencyKey());
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

  const amountHelper = useMemo(() => {
    if (selectedType === "REFUND") {
      return `Max ${appointmentPriceFormatter.format(collected)} can be refunded.`;
    }
    return `Total price: ${appointmentPriceFormatter.format(totalPrice)}.`;
  }, [selectedType, collected, totalPrice]);

  async function submit(values: RecordPaymentValues) {
    try {
      await recordTransactionApi(appointmentId, {
        type: values.type,
        amount: values.amount,
        method: values.method,
        gatewayRef: values.gatewayRef?.trim() ? values.gatewayRef.trim() : undefined,
        idempotencyKey,
      });
      toast.success("Payment recorded.");
      onRecorded();
      onOpenChange(false);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        // 409 = "this idempotency key already recorded a transaction". The
        // payment went through on a previous attempt; treat as success and
        // refresh the ledger rather than scaring the user with an error.
        toast.info("This payment was already recorded.");
        onRecorded();
        onOpenChange(false);
        return;
      }
      const message =
        caught instanceof ApiError
          ? caught.message
          : "Couldn't record the payment. Please try again.";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Add an advance, final settlement, or refund to this appointment.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(submit)}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="payment-type">Type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(value as PaymentTxnType)
                  }
                >
                  <SelectTrigger
                    id="payment-type"
                    className="h-10 w-full"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.type)}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.type.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-amount">Amount (₹)</Label>
            <Input
              id="payment-amount"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              placeholder="e.g. 500"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.amount)}
              {...register("amount")}
            />
            {errors.amount?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.amount.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{amountHelper}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-method">Method</Label>
            <Controller
              name="method"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(value as PaymentMethod)
                  }
                >
                  <SelectTrigger
                    id="payment-method"
                    className="h-10 w-full"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.method)}
                  >
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.method?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.method.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-gateway-ref">
              Gateway reference{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="payment-gateway-ref"
              type="text"
              maxLength={128}
              placeholder="e.g. UPI txn ID or cash receipt no."
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.gatewayRef)}
              {...register("gatewayRef")}
            />
            {errors.gatewayRef?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.gatewayRef.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Recording…" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
