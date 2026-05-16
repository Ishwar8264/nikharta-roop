"use client";

import { AlertDialog } from "@/components/ui/shared/alertbox/alert-dialog";

type UnsavedChangesDialogProps = {
  onDiscard: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

// Shared discard prompt for forms with unsaved changes.
export function UnsavedChangesDialog({
  onDiscard,
  onOpenChange,
  open,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog
      cancelLabel="Continue editing"
      confirmLabel="Discard changes"
      description="Your form has unsaved changes that will be lost."
      onConfirm={onDiscard}
      onOpenChange={onOpenChange}
      open={open}
      title="Discard unsaved changes?"
      variant="danger"
    />
  );
}
