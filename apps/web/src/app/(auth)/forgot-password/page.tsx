import { ForgotPasswordForm } from "@/features/auth/forgot-password/components/forgot-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password · Nikharta Roop",
  description: "Reset your Nikharta Roop account password.",
};

/**
 * Forgot password page.
 *
 * Why no Suspense:
 * The form does not call `useSearchParams()` — it only reads FormData on
 * submit. No searchParams means the page can stay statically pre-rendered.
 */
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
