import { RegisterForm } from "@/src/components/auth/register/register-form";
import type { Metadata } from "next";

// Describe the signup route in browser tabs and search previews.
export const metadata: Metadata = {
  description:
    "Create your Nikharta Roop account using a secure one-time password.",
  title: "Sign Up | Nikharta Roop",
};

// Keep the route focused on composing the reusable registration feature.
export default function SignUpPage() {
  // Expose mobile only where the backend development fallback can deliver its OTP.
  const mobileAvailable = process.env.NODE_ENV !== "production";

  // Render server-owned copy around the interactive signup form island.
  return <RegisterForm mobileAvailable={mobileAvailable} />;
}
