import { RegisterForm } from "@/src/components/auth/register-form";
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
  const mobileRegistrationAvailable = process.env.NODE_ENV !== "production";

  // Render the client form inside the shared authentication layout.
  return (
    <RegisterForm
      mobileRegistrationAvailable={mobileRegistrationAvailable}
    />
  );
}
