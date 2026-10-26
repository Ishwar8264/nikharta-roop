"use client";

import { ReceiptIndianRupee } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { appointmentPriceFormatter } from "@/features/appointment/format";

import { RecordPaymentDialog } from "./record-payment-dialog";
import type {
  PaymentLedgerProps,
  PaymentMethod,
  PaymentTransaction,
  PaymentTxnType,
} from "./types";

const TXN_TYPE_LABEL: Record<PaymentTxnType, string> = {
  ADVANCE: "Advance",
  FINAL: "Final",
  REFUND: "Refund",
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  UPI: "UPI",
  CASH: "Cash",
  CARD: "Card",
  WALLET: "Wallet",
  ONLINE: "Online",
};

/**
 * Date/time formatter for transaction rows.
 *
 * The appointment detail page already shows the salon-local time for the
 * appointment start; the ledger keeps the same `en-IN` "12 Oct 2026, 4:30 pm"
 * shape so the two read consistently. We omit the timezone because the
 * transaction's `createdAt` is a server timestamp and the ledger does not
 * receive the salon's timezone as a prop — the locale formatter falls back
 * to the runtime's local zone, which is correct for an India-first audience.
 */
const transactionDateFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Computes paid (ADVANCE + FINAL), refunded (REFUND), and balance due. */
function computeTotals(transactions: PaymentTransaction[], totalPrice: number) {
  let paid = 0;
  let refunded = 0;
  for (const txn of transactions) {
    if (txn.type === "REFUND") {
      refunded += txn.amount;
    } else {
      paid += txn.amount;
    }
  }
  const netCollected = paid - refunded;
  const balanceDue = Math.max(0, totalPrice - netCollected);
  return { paid, refunded, netCollected, balanceDue };
}

/** Appointment payment ledger — list + running totals + record dialog. */
export function PaymentLedger({
  appointmentId,
  totalPrice,
  transactions,
  canRecord,
}: PaymentLedgerProps) {
  const [recordOpen, setRecordOpen] = useState(false);
  const totals = computeTotals(transactions, totalPrice);

  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">Payments</h2>
        {canRecord ? (
          <Button
            type="button"
            size="sm"
            onClick={() => setRecordOpen(true)}
          >
            Record payment
          </Button>
        ) : null}
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={ReceiptIndianRupee}
          title="No payments recorded yet."
          description={
            canRecord
              ? "Record an advance or final payment to track what's been collected."
              : "The salon will record payments here as they're collected."
          }
          className="mt-4 py-10"
        />
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {transactions.map((txn) => (
            <li
              key={txn.id}
              className="flex flex-wrap items-start justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <TxnTypeBadge type={txn.type} />
                  <span className="text-sm text-muted-foreground">
                    {METHOD_LABEL[txn.method]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {transactionDateFormatter.format(new Date(txn.createdAt))}
                </p>
                {txn.gatewayRef ? (
                  <p className="mt-0.5 text-xs text-muted-foreground/80">
                    Ref: {txn.gatewayRef}
                  </p>
                ) : null}
              </div>
              <p
                className={
                  txn.type === "REFUND"
                    ? "font-medium text-destructive"
                    : "font-medium"
                }
              >
                {txn.type === "REFUND" ? "−" : ""}
                {appointmentPriceFormatter.format(txn.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Paid so far</dt>
          <dd>{appointmentPriceFormatter.format(totals.paid)}</dd>
        </div>
        {totals.refunded > 0 ? (
          <div className="flex justify-between text-destructive">
            <dt>Refunded</dt>
            <dd>−{appointmentPriceFormatter.format(totals.refunded)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
          <dt>Balance due</dt>
          <dd>{appointmentPriceFormatter.format(totals.balanceDue)}</dd>
        </div>
      </dl>

      {canRecord ? (
        <RecordPaymentDialog
          appointmentId={appointmentId}
          totalPrice={totalPrice}
          collected={totals.paid}
          open={recordOpen}
          onOpenChange={setRecordOpen}
          onRecorded={() => setRecordOpen(false)}
        />
      ) : null}
    </section>
  );
}

/** Type badge — Advance/Final in semantic colors, Refund as destructive. */
function TxnTypeBadge({ type }: { type: PaymentTxnType }) {
  if (type === "REFUND") {
    return <Badge variant="destructive">{TXN_TYPE_LABEL[type]}</Badge>;
  }
  if (type === "FINAL") {
    return (
      <Badge className="bg-success/10 text-success focus-visible:ring-success/20 dark:bg-success/20">
        {TXN_TYPE_LABEL[type]}
      </Badge>
    );
  }
  return (
    <Badge className="bg-info/10 text-info focus-visible:ring-info/20 dark:bg-info/20">
      {TXN_TYPE_LABEL[type]}
    </Badge>
  );
}
