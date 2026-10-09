"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { AdminReviewSheet } from "./admin-review-sheet";
import type { SalonVerification } from "./api";

interface AdminVerificationRowProps {
  salon: { slug: string; name: string; city?: string | null };
  verification: SalonVerification;
}

/**
 * One row's review trigger — opens the dialog, holds its open state.
 *
 * Why this is a client component:
 * The surrounding queue page renders the static row content (salon name,
 * city, date) server-side. Only the "Review" button + its dialog need client
 * state, so this small wrapper is the only client boundary per row.
 */
export function AdminVerificationRow({
  salon,
  verification,
}: AdminVerificationRowProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Review
      </Button>
      <AdminReviewSheet
        salon={salon}
        verification={verification}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
