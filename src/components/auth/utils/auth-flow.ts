import { ApiClientError } from "@/src/lib/api-client";
import type { AuthPurpose } from "@/src/types/auth";

// Describe route-level copy that remains stable for one authentication purpose.
export type AuthFlowCopy = {
  alternateAction: string;
  alternateHref: "/login" | "/signup";
  alternatePrompt: string;
  completeDescription: string;
  completeTitle: string;
  description: string;
  submitLabel: string;
  submittingLabel: string;
  title: string;
  verifyLabel: string;
};

// Keep login and signup language centralized so shared components stay generic.
const AUTH_FLOW_COPY: Record<AuthPurpose, AuthFlowCopy> = {
  LOGIN: {
    alternateAction: "Create an account",
    alternateHref: "/signup",
    alternatePrompt: "New to Nikharta Roop?",
    completeDescription: "Your identity is verified and you're securely signed in.",
    completeTitle: "Welcome back",
    description: "Enter your email and we'll send you a secure login code.",
    submitLabel: "Continue",
    submittingLabel: "Sending OTP...",
    title: "Welcome back",
    verifyLabel: "Verify and log in",
  },
  SIGNUP: {
    alternateAction: "Log in",
    alternateHref: "/login",
    alternatePrompt: "Already have an account?",
    completeDescription: "Your account is verified and you're securely signed in.",
    completeTitle: "Account created",
    description: "Enter your email and we'll send you a verification code.",
    submitLabel: "Continue",
    submittingLabel: "Sending OTP...",
    title: "Create your account",
    verifyLabel: "Verify and create account",
  },
};

// Add mobile wording only when the server can actually deliver mobile OTPs.
export function getAuthFlowCopy(
  purpose: AuthPurpose,
  mobileAvailable: boolean,
): AuthFlowCopy {
  // Read the immutable purpose-specific copy before adding capability wording.
  const copy = AUTH_FLOW_COPY[purpose];

  // Return email-only wording when production mobile delivery is unavailable.
  if (!mobileAvailable) {
    return copy;
  }

  // Describe both channels without mutating the shared copy object.
  return {
    ...copy,
    description:
      purpose === "LOGIN"
        ? "Choose email or mobile and we'll send you a secure login code."
        : "Choose email or mobile and we'll send you a verification code.",
  };
}

// Preserve expected backend errors while hiding unexpected implementation details.
export function getAuthErrorMessage(error: unknown): string {
  // Return the validated API message for known request failures.
  if (error instanceof ApiClientError) {
    return error.message;
  }

  // Use one safe fallback for programming or unknown runtime failures.
  return "Something went wrong. Please try again.";
}
