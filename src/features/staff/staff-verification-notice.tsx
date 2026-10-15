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
      await sendOtpApi({ email });
      setMessage("Verification email sent.");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Unable to send email. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">Email verification pending</p>
          <p className="text-xs text-muted-foreground">Verify email to enable salon access and bookings.</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="shrink-0" disabled={busy} onClick={() => void resend()}>{busy ? "Sending…" : "Resend email"}</Button>
      </div>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
