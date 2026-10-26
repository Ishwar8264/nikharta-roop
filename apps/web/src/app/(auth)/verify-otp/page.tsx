import { VerifyOtpForm } from "@/features/auth/verify-otp/components/verifyOtpForm";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Verify email · Nikharta Roop",
  description: "Verify your email to activate your account.",
};

/**
 * Verify OTP page.
 *
 * Why Suspense:
 * `useSearchParams()` inside VerifyOtpForm forces the page out of static
 * pre-rendering unless wrapped in Suspense. Without this boundary, the whole
 * page would defer to the client; with it, the shell stays static.
 */
export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpForm />
    </Suspense>
  );
}
