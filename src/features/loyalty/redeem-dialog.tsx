"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { ApiError } from "@/lib/api/backend.client";

import { redeemPointsApi } from "./api";
import type { RedeemDialogProps } from "./types";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/**
 * Dialog for redeeming loyalty points.
 *
 * Shows the live discount preview (points × redeemRatePerPoint) and caps
 * the input at the available balance. On success, fires `onRedeemed` so the
 * parent can refresh the balance + transaction list.
 */
export function RedeemDialog({
  balance,
  open,
  onOpenChange,
  onRedeemed,
}: RedeemDialogProps) {
  const router = useRouter();
  const [pointsStr, setPointsStr] = useState("");
  const [busy, setBusy] = useState(false);

  const points = Math.max(0, Math.floor(Number(pointsStr) || 0));
  const previewRupees = points * balance.redeemRatePerPoint;
  const exceedsBalance = points > balance.points;
  const canSubmit = points > 0 && !exceedsBalance && !busy;

  async function handleRedeem() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const result = await redeemPointsApi({ points });
      toast.success(
        `Redeemed ${result.data.pointsRedeemed.toLocaleString("en-IN")} points for ${inrFormatter.format(result.data.discountRupees)}.`,
      );
      setPointsStr("");
      onOpenChange(false);
      onRedeemed();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not redeem points. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redeem loyalty points</DialogTitle>
          <DialogDescription>
            Convert your points into a discount. You have{" "}
            {balance.points.toLocaleString("en-IN")} points worth{" "}
            {inrFormatter.format(balance.pointsValueRupees)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="redeem-points">Points to redeem</Label>
            <Input
              id="redeem-points"
              type="number"
              min={1}
              max={balance.points}
              step={1}
              placeholder="e.g. 100"
              value={pointsStr}
              onChange={(e) => setPointsStr(e.target.value)}
              disabled={busy}
              aria-invalid={exceedsBalance}
            />
            {exceedsBalance ? (
              <p role="alert" className="text-xs text-destructive">
                You only have {balance.points.toLocaleString("en-IN")} points.
              </p>
            ) : points > 0 ? (
              <p className="text-xs text-muted-foreground">
                Worth {inrFormatter.format(previewRupees)} ·{" "}
                {balance.points - points} points will remain.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Rate: 1 point = {inrFormatter.format(balance.redeemRatePerPoint)}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleRedeem}
            disabled={!canSubmit}
          >
            {busy ? "Redeeming…" : "Redeem points"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
