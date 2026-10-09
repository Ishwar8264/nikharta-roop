"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { RedeemDialog } from "./redeem-dialog";
import type { LoyaltyBalance } from "./types";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

interface BalanceCardProps {
  balance: LoyaltyBalance;
}

/**
 * Loyalty balance display with a "Redeem points" affordance.
 *
 * Why a client component:
 * The redeem button opens a dialog (local UI state), and the dialog posts
 * to the loyalty API. The balance + INR value are server-passed props.
 */
export function BalanceCard({ balance }: BalanceCardProps) {
  const [redeemOpen, setRedeemOpen] = useState(false);

  return (
    <Card>
      <CardContent className="flex flex-wrap items-end justify-between gap-4 p-6">
        <div>
          <p className="text-sm text-muted-foreground">Available points</p>
          <p className="mt-1 font-heading text-5xl font-semibold tabular-nums">
            {balance.points.toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Worth {inrFormatter.format(balance.pointsValueRupees)} · earn 1 point per ₹{balance.earnRatePerRupee}
          </p>
        </div>
        <Button
          onClick={() => setRedeemOpen(true)}
          disabled={balance.points <= 0}
        >
          Redeem points
        </Button>
        <RedeemDialog
          balance={balance}
          open={redeemOpen}
          onOpenChange={setRedeemOpen}
          onRedeemed={() => {}}
        />
      </CardContent>
    </Card>
  );
}
