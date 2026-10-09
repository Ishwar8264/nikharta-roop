"use client";

import { Pencil, PowerOff, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

import { deactivateCouponApi, updateCouponApi } from "./api";
import {
  buildDiscountSummary,
  formatCouponDateTime,
} from "./schemas";
import type { CouponView } from "./types";

interface CouponTableProps {
  salonSlug: string;
  coupons: CouponView[];
  /** Informs the parent (manager) that the user clicked "Edit" on a row. */
  onEdit: (coupon: CouponView) => void;
}

/** Per-row actions shared by the mobile card and desktop row. */
function CouponRowActions({
  salonSlug,
  coupon,
  onEdit,
}: {
  salonSlug: string;
  coupon: CouponView;
  onEdit: (coupon: CouponView) => void;
}) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(coupon.isActive);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleToggle(next: boolean) {
    const previous = isActive;
    setIsActive(next); // optimistic — visibility flag only, no money moves
    try {
      await updateCouponApi(salonSlug, coupon.id, { isActive: next });
      toast.success(
        next
          ? `${coupon.code} is active again.`
          : `${coupon.code} is paused.`,
      );
      startTransition(() => router.refresh());
    } catch (error) {
      setIsActive(previous);
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not update the coupon. Please try again.",
      );
    }
  }

  async function handleDeactivate() {
    setDeactivating(true);
    try {
      await deactivateCouponApi(salonSlug, coupon.id);
      toast.success(`${coupon.code} deactivated.`);
      setConfirmOpen(false);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not deactivate the coupon. Please try again.",
      );
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <div className="flex items-center gap-2">
        <Switch
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={isPending}
          aria-label={`${isActive ? "Pause" : "Activate"} ${coupon.code}`}
        />
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {isActive ? "Active" : "Paused"}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(coupon)}
        disabled={isPending}
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        Edit
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending || deactivating}
        aria-label={`Deactivate ${coupon.code}`}
      >
        <PowerOff className="h-4 w-4 text-destructive" aria-hidden="true" />
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate {coupon.code}?</DialogTitle>
            <DialogDescription>
              Customers will no longer be able to apply this coupon. Existing
              bookings keep their discount. You can reactivate it any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deactivating}
            >
              Keep it
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivating}
            >
              {deactivating ? "Deactivating…" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Formats the usage cell as "23/100 used" or "23 used" (no cap). */
function usageLabel(coupon: CouponView): string {
  const used = coupon.usedCount;
  return coupon.usageLimit
    ? `${used}/${coupon.usageLimit} used`
    : `${used} used`;
}

/**
 * Lists the salon's coupons with mobile cards and a desktop table. Toggle is
 * optimistic; edit and deactivate hand off to the manager and the API.
 */
export function CouponTable({ salonSlug, coupons, onEdit }: CouponTableProps) {
  if (coupons.length === 0) {
    return (
      <EmptyState
        icon={Ticket}
        title="No coupons yet"
        description="Create your first offer — a Diwali percentage off or a flat ₹-back promo works best."
      />
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <ul className="mt-8 space-y-3 lg:hidden">
        {coupons.map((coupon) => (
          <li
            key={coupon.id}
            className="space-y-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-base font-semibold uppercase">
                  {coupon.code}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {buildDiscountSummary(coupon)}
                </p>
              </div>
              <Badge variant={coupon.isActive ? "secondary" : "outline"}>
                {coupon.isActive ? "Active" : "Paused"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCouponDateTime(coupon.validFrom)} →{" "}
              {formatCouponDateTime(coupon.validUntil)} · {usageLabel(coupon)}
            </p>
            <CouponRowActions
              salonSlug={salonSlug}
              coupon={coupon}
              onEdit={onEdit}
            />
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="mt-8 hidden overflow-x-auto rounded-xl border lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Valid</th>
              <th className="px-4 py-3 font-medium">Usage</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="bg-card">
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "font-mono font-semibold uppercase tracking-wide",
                      !coupon.isActive && "text-muted-foreground",
                    )}
                  >
                    {coupon.code}
                  </span>
                  {coupon.description ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {coupon.description}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {buildDiscountSummary(coupon)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatCouponDateTime(coupon.validFrom)}
                  <br />
                  <span className="text-xs">
                    to {formatCouponDateTime(coupon.validUntil)}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {usageLabel(coupon)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={coupon.isActive ? "secondary" : "outline"}>
                    {coupon.isActive ? "Active" : "Paused"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <CouponRowActions
                    salonSlug={salonSlug}
                    coupon={coupon}
                    onEdit={onEdit}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
