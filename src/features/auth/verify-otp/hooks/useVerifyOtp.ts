"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/backend.client";
import { sendOtpApi } from "../api/sendOtp";
import { verifyOtpApi } from "../api/verifyOtp";

type Step = "send" | "verify";

interface UseVerifyOtpResult {
  step: Step;
  email: string;
  code: string;
  setCode: (code: string) => void;
  sendCode: () => Promise<void>;
  verifyCode: () => Promise<void>;
  isSending: boolean;
  isVerifying: boolean;
  error: string | null;
  /** Seconds remaining before resend is allowed. 0 = resend available. */
  resendIn: number;
}

/**
 * Orchestrates the two-step email verification flow.
 *
 * Why verify lands on home, not /login:
 * The verify endpoint issues session cookies on success (same contract as
 * login). At that point the user IS signed in — routing them to a login
 * form would force a pointless credential re-entry. Home is the canonical
 * post-auth landing page for every email/password flow.
 *
 * Why a state machine ("send" | "verify") instead of one form:
 * OTP endpoints are separate — send then verify — with distinct cooldowns,
 * retries, and errors. Modelling them as steps makes each screen's
 * affordances unambiguous.
 *
 * Why the cooldown timer lives here:
 * The backend enforces a per-user resend cooldown. Mirroring it client-side
 * gives the user a live countdown instead of an unpredictable 429. The
 * server remains authoritative; this is only a courtesy.
 */
export function useVerifyOtp(email: string): UseVerifyOtpResult {
  const router = useRouter();
  const [step, setStep] = useState<Step>("send");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  // A one-shot timeout avoids interval bookkeeping and is safely cleaned up
  // whenever the countdown changes or the component unmounts.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timeout = window.setTimeout(
      () => setResendIn((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearTimeout(timeout);
  }, [resendIn]);

  async function sendCode() {
    setIsSending(true);
    setError(null);

    try {
      const res = await sendOtpApi({ email });
      setResendIn(res.data.resendAvailableInSeconds);
      setStep("verify");
    } catch (e) {
      if (e instanceof ApiError) {
        // 429 with Retry-After means we're inside the cooldown window —
        // not really an error. Drop the user into verify and start counting
        // so the UI reflects reality instead of blocking them.
        if (e.status === 429) {
          setStep("verify");
          setResendIn(e.retryAfterSeconds ?? 60);
          setError(e.message);
        } else {
          setError(e.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  }

  async function verifyCode() {
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      await verifyOtpApi({ email, code });

      // Server has set session cookies — the browser is now signed in.
      // refresh() re-fetches Server Components so the header's user menu
      // reflects the new session before the home page renders.
      router.refresh();
      router.replace(routes.home);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        // Clear the code on rejection so the user can retype without
        // manually deleting six digits. The email is still theirs; they
        // can resend if the code has truly expired.
        setCode("");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  }

  return {
    step,
    email,
    code,
    setCode,
    sendCode,
    verifyCode,
    isSending,
    isVerifying,
    error,
    resendIn,
  };
}
