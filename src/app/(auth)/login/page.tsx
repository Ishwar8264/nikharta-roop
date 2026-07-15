import { LoginForm } from "@/src/components/auth/login/login-form";
import type { Metadata } from "next";

// Describe the login route in browser tabs and search previews.
export const metadata: Metadata = {
  description: "Log in to Nikharta Roop using a secure one-time password.",
  title: "Log In | Nikharta Roop",
};

// Keep the App Router page server-only and focused on feature composition.
export default function LoginPage() {
  // Expose mobile only where the backend development fallback can deliver its OTP.
  const mobileAvailable = process.env.NODE_ENV !== "production";

  // Render server-owned copy around the interactive login form island.
  return <LoginForm mobileAvailable={mobileAvailable} />;
}
