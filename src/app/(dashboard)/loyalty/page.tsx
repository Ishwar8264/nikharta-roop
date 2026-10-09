import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/get-session";
import { routes } from "@/config/routes";
import { getBalance, listTransactions } from "@/server/modules/loyalty/loyalty.service";

export const metadata: Metadata = {
  title: "Loyalty points | Nikharta Roop",
};

const txnDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Customer loyalty dashboard — balance + transaction history. */
export default async function LoyaltyPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [balance, transactions] = await Promise.all([
    getBalance(user.id),
    listTransactions(user.id, { limit: 50 }),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold">Loyalty rewards</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Earn points on every completed appointment. Redeem for discounts on future bookings.
        </p>
      </header>

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
          <Button>Redeem points</Button>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold">Activity</h2>
        {transactions.items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No activity yet. Complete an appointment to start earning points.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {transactions.items.map((txn) => (
              <li key={txn.id} className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={txn.type === "EARNED" ? "secondary" : "outline"}>
                      {txn.type === "EARNED" ? "Earned" : txn.type === "REDEEMED" ? "Redeemed" : txn.type.toLowerCase()}
                    </Badge>
                    <span className="truncate text-sm text-muted-foreground">
                      {txn.description ?? "Loyalty activity"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {txnDateFormatter.format(new Date(txn.createdAt))}
                  </p>
                </div>
                <span
                  className={
                    txn.points >= 0
                      ? "font-semibold tabular-nums text-emerald-600"
                      : "font-semibold tabular-nums text-destructive"
                  }
                >
                  {txn.points >= 0 ? "+" : ""}
                  {txn.points.toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-sm text-muted-foreground">
        <a href={routes.appointments} className="text-primary underline">
          Book your next appointment
        </a>{" "}
        to keep earning.
      </p>
    </main>
  );
}
