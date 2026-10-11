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
      setMessage("Verification email sent. The staff member must complete verification themselves.");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Unable to send email. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
      <p className="text-sm">Email verification is pending. Salon access and customer bookings remain blocked until the staff member verifies their email.</p>
      <Button type="button" variant="outline" disabled={busy} onClick={() => void resend()}>{busy ? "Sending…" : "Resend verification email"}</Button>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
