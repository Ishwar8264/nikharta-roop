import Link from "next/link";

import { Button } from "@/components/ui/button";
import { BranchSubmitButton } from "@/features/branches/components/branch-submit-button";

type BranchFormActionsProps = {
  disabled: boolean;
  submitLabel: string;
};

// Shared action row for branch create and edit forms.
export function BranchFormActions({
  disabled,
  submitLabel,
}: BranchFormActionsProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <BranchSubmitButton disabled={disabled} label={submitLabel} />
      <Button asChild type="button" variant="outline">
        <Link href="/admin/branches">Cancel</Link>
      </Button>
    </div>
  );
}
