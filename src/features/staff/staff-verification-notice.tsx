"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sendOtpApi } from "@/features/auth/verify-otp/api/sendOtp";
import { ApiError } from "@/lib/api/backend.client";

/** Delivery can be retried without creating another account or membership. */
export function StaffVerificationNotice({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    if (busy) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      await sendOtpApi({ email, staffActivation: true });
      setMessage("Activation email sent. Ask the member to open the link in their inbox.");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Unable to send email. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-2 rounded-xl border border-warning/40 bg-warning/15 p-4">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">Email verification pending</p>
          <p className="text-xs text-amber-900 dark:text-amber-200">Verify email to enable salon access and bookings.</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="shrink-0 border-warning bg-warning text-warning-foreground hover:bg-warning/80 hover:text-warning-foreground" disabled={busy} onClick={() => void resend()}>{busy ? "Sending…" : "Resend email"}</Button>
      </div>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
