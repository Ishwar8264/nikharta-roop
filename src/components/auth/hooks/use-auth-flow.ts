"use client";

import { useState } from "react";

import type { AuthIdentifierInput } from "@/src/types/auth";

// Describe each visible state in the reusable OTP authentication journey.
export type AuthFlowStep = "IDENTITY" | "OTP" | "COMPLETE";

// Own cross-step state so the flow component remains focused on composition.
export function useAuthFlow() {
  // Start every login or signup journey by collecting one identity.
  const [step, setStep] = useState<AuthFlowStep>("IDENTITY");

  // Preserve the normalized identity between OTP delivery and verification.
  const [identity, setIdentity] = useState<AuthIdentifierInput | null>(null);

  // Advance only after the purpose-specific endpoint confirms OTP delivery.
  const handleOtpSent = (nextIdentity: AuthIdentifierInput) => {
    // Retain the normalized email or mobile used by the backend OTP record.
    setIdentity(nextIdentity);

    // Replace identity collection with the six-digit verification form.
    setStep("OTP");
  };

  // Return to identity collection when the customer needs to correct it.
  const handleIdentityChange = () => {
    // Remove the previous identity before accepting another destination.
    setIdentity(null);

    // Render the identity form again.
    setStep("IDENTITY");
  };

  // Complete the UI journey after OTP verification establishes the session.
  const handleVerified = () => {
    // Replace the verification form with the purpose-specific success state.
    setStep("COMPLETE");
  };

  // Expose only state and transitions required by the flow composition.
  return {
    handleIdentityChange,
    handleOtpSent,
    handleVerified,
    identity,
    step,
  };
}
