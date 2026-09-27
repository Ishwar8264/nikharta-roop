import { ResetPasswordForm } from "@/features/auth/forgot-password/components/reset-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Set new password · Nikharta Roop",
  description: "Choose a new password for your account.",
};

/**
 * Reset password page.
 *
 * Why Suspense:
 * ResetPasswordForm reads `useSearchParams()` to get the email and initial
 * cooldown. That hook forces the page out of static pre-rendering unless
 * wrapped — without the boundary, Next.js defers the whole page to the
 * client and logs a build warning.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
