"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import { Switch } from "@/components/ui/switch";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/backend.client";

import { deletePackageApi, updatePackageApi } from "./api";
import type { PublicPackage } from "./types";

interface PackageRowActionsProps {
  salonSlug: string;
  pkg: PublicPackage;
}

/**
 * Per-row management actions — optimistic visibility toggle with rollback,
 * and a confirm-guarded soft delete.
 */
export function PackageRowActions({ salonSlug, pkg }: PackageRowActionsProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(pkg.isActive);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleToggle(next: boolean) {
    const previous = isActive;
    setIsActive(next); // optimistic — visibility only, no money moves
    try {
      await updatePackageApi(salonSlug, pkg.id, { isActive: next });
      toast.success(
        next
          ? `${pkg.name} is visible to customers again.`
          : `${pkg.name} is hidden from customers.`,
      );
      startTransition(() => router.refresh());
    } catch (error) {
      setIsActive(previous);
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not update the package. Please try again.",
      );
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deletePackageApi(salonSlug, pkg.id);
      toast.success(`${pkg.name} removed.`);
      setConfirmOpen(false);
      router.push(routes.salonPackagesManage(salonSlug));
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not remove the package. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <div className="flex items-center gap-2">
        <Switch
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={isPending}
          aria-label={`${isActive ? "Deactivate" : "Activate"} ${pkg.name}`}
        />
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        render={<Link href={routes.salonPackageEdit(salonSlug, pkg.id)} />}
      >
        Edit
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setConfirmOpen(true)}
        aria-label={`Delete ${pkg.name}`}
      >
        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this package?</DialogTitle>
            <DialogDescription>
              {pkg.name} will no longer be visible to customers. Existing
              bookings are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Removing…" : "Remove package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
