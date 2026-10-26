"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { routes } from "@/config/routes";

import { CouponForm } from "./coupon-form";
import { CouponTable } from "./coupon-table";
import type { CouponView } from "./types";

interface CouponManagerProps {
  /** Required for salon scope; omit when `admin` is true. */
  salonSlug?: string;
  /** Required for salon scope; ignored when `admin` is true. */
  salonName?: string;
  /** When true, the manager operates on platform-wide coupons via `/admin/coupons`. */
  admin?: boolean;
  coupons: CouponView[];
}

/**
 * Owns the dialog state for both "New coupon" and "Edit coupon" flows and
 * renders the table. The server page is the source of truth for the list —
 * after every mutation we call `router.refresh()` and let the server re-render
 * with fresh data.
 */
export function CouponManager({
  salonSlug,
  salonName,
  admin = false,
  coupons,
}: CouponManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CouponView | null>(null);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(coupon: CouponView) {
    setEditing(coupon);
    setDialogOpen(true);
  }

  function handleSaved() {
    setDialogOpen(false);
    setEditing(null);
    startTransition(() => router.refresh());
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {admin ? (
            <p className="text-sm text-muted-foreground">
              Platform-wide coupons
            </p>
          ) : (
            <Link
              href={routes.salonDetail(salonSlug as string)}
              className="text-sm text-primary underline"
            >
              Public salon page
            </Link>
          )}
          <h1 className="mt-3 font-heading text-3xl font-semibold">Coupons</h1>
          <p className="mt-2 text-muted-foreground">
            {admin ? "Available at every salon" : (salonName ?? "")}
          </p>
        </div>
        <Button onClick={openNew} disabled={isPending}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New coupon
        </Button>
      </header>

      <CouponTable
        salonSlug={salonSlug}
        admin={admin}
        coupons={coupons}
        onEdit={openEdit}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <CouponForm
            salonSlug={salonSlug}
            admin={admin}
            initial={editing ?? undefined}
            onSaved={handleSaved}
            onCancel={() => {
              setDialogOpen(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
