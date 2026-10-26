"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { routes } from "@/config/routes";
import { removeSalonMemberApi } from "@/features/salon/api/manage";
import { ApiError } from "@/lib/api/backend.client";

/** Removes salon membership after confirmation; the personal account is retained. */
export function DeleteStaffButton({ salonId, salonSlug, memberId, memberName }: {
  salonId: string; salonSlug: string; memberId: string; memberName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await removeSalonMemberApi(salonId, memberId);
      toast.success("Member removed from salon.");
      setOpen(false);
      router.push(routes.salonStaff(salonSlug));
      router.refresh();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Unable to remove member. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button type="button" variant="destructive" size="sm" onClick={() => { setError(null); setOpen(true); }}>
        <Trash2 className="size-3.5" aria-hidden="true" /> Delete member
      </Button>
      <Dialog open={open} onOpenChange={(next) => { if (!busy) setOpen(next); }}>
        <DialogContent showCloseButton={!busy}>
          <DialogHeader>
            <DialogTitle>Delete member?</DialogTitle>
            <DialogDescription>Remove {memberName} from this salon? Their personal account will remain.</DialogDescription>
          </DialogHeader>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={busy} onClick={() => void remove()}>{busy ? "Removing…" : "Confirm delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
