"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { RegisterIdentityStep } from "@/src/components/auth/register-identity-step";
import { RegisterOtpStep } from "@/src/components/auth/register-otp-step";
import type { RegisterInput } from "@/src/types/auth";

// Describe the three explicit states of the customer registration journey.
type RegisterStep = "IDENTITY" | "OTP" | "COMPLETE";

// Configure only server-confirmed authentication capabilities in the client UI.
type RegisterFormProps = {
  mobileRegistrationAvailable: boolean;
};

// Orchestrate focused registration steps without mixing their form implementations.
export function RegisterForm({
  mobileRegistrationAvailable,
}: RegisterFormProps) {
  // Start by collecting one supported signup identity.
  const [step, setStep] = useState<RegisterStep>("IDENTITY");

  // Preserve the normalized identity between OTP sending and verification.
  const [pendingIdentity, setPendingIdentity] =
    useState<RegisterInput | null>(null);

  // Preserve the backend delivery confirmation for the OTP step.
  const [deliveryMessage, setDeliveryMessage] = useState("");

  // Move to verification only after the register API confirms OTP delivery.
  const handleOtpSent = (identity: RegisterInput, message: string) => {
    // Retain the normalized email or mobile used by the backend OTP record.
    setPendingIdentity(identity);

    // Show the server-confirmed delivery result on the next step.
    setDeliveryMessage(message);

    // Replace the identity form with the six-digit verification form.
    setStep("OTP");
  };

  // Return to identity collection when the customer needs to correct it.
  const handleIdentityChange = () => {
    // Remove the previous identity before accepting another OTP destination.
    setPendingIdentity(null);

    // Remove stale delivery feedback tied to the previous identity.
    setDeliveryMessage("");

    // Render the first registration step again.
    setStep("IDENTITY");
  };

  // Complete the UI journey after the server verifies OTP and sets cookies.
  const handleVerified = () => {
    // Replace the OTP form with a clear successful registration state.
    setStep("COMPLETE");
  };

  // Render the final state only after the server verifies the submitted OTP.
  if (step === "COMPLETE") {
    return (
      <section aria-labelledby="signup-complete-heading" className="text-center">
        {/* Visually confirm that both account creation and sign-in succeeded. */}
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 aria-hidden="true" className="size-7" />
        </span>

        {/* Give the completed registration state one clear heading. */}
        <h1
          className="font-display mt-5 text-3xl font-semibold tracking-[-0.025em]"
          id="signup-complete-heading"
        >
          Account created
        </h1>

        {/* Explain that the protected browser session is already active. */}
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your identity is verified and you&apos;re securely signed in.
        </p>

        {/* Continue to the current application home after registration completes. */}
        <Link
          className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          href="/"
        >
          Continue to home
        </Link>
      </section>
    );
  }

  // Render verification only when a successful register request supplied identity.
  if (step === "OTP" && pendingIdentity) {
    return (
      <RegisterOtpStep
        deliveryMessage={deliveryMessage}
        identity={pendingIdentity}
        onChangeIdentity={handleIdentityChange}
        onVerified={handleVerified}
      />
    );
  }

  // Render the first step with only authentication channels the server supports.
  return (
    <RegisterIdentityStep
      mobileRegistrationAvailable={mobileRegistrationAvailable}
      onOtpSent={handleOtpSent}
    />
  );
}
