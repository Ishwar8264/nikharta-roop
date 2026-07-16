"use client";

import type { ReactNode } from "react";

import { useAuthFlow } from "@/src/components/auth/hooks/use-auth-flow";
import { AuthComplete } from "@/src/components/auth/shared/auth-complete";
import { AuthIdentityStep } from "@/src/components/auth/shared/auth-identity-step";
import { AuthOtpStep } from "@/src/components/auth/shared/auth-otp-step";
import { getAuthFlowCopy } from "@/src/components/auth/utils/auth-flow";
import type { AuthPurpose } from "@/src/types/auth";

// Accept server-rendered introductory HTML as children around one client island.
type AuthFlowProps = {
  children: ReactNode;
  mobileAvailable: boolean;
  purpose: AuthPurpose;
};

// Compose shared identity, OTP, and success states without duplicating business logic.
export function AuthFlow({
  children,
  mobileAvailable,
  purpose,
}: AuthFlowProps) {
  // Own only the state required to move between focused auth steps.
  const {
    handleIdentityChange,
    handleOtpSent,
    handleVerified,
    identity,
    step,
  } = useAuthFlow();

  // Read purpose-specific copy while respecting server-confirmed channel capability.
  const copy = getAuthFlowCopy(purpose, mobileAvailable);

  // Render the final state only after the server verifies the submitted OTP.
  if (step === "COMPLETE") {
    return <AuthComplete copy={copy} />;
  }

  // Render verification only when OTP delivery supplied a normalized identity.
  if (step === "OTP" && identity) {
    return (
      <AuthOtpStep
        copy={copy}
        identity={identity}
        onChangeIdentity={handleIdentityChange}
        onVerified={handleVerified}
        purpose={purpose}
      />
    );
  }

  // Render server-owned introduction around the smallest interactive form boundary.
  return (
    <section aria-labelledby={`${purpose.toLowerCase()}-heading`}>
      {/* Preserve static route HTML supplied by the parent Server Component. */}
      {children}

      {/* Hydrate only identity controls, validation, and submission behavior. */}
      <AuthIdentityStep
        copy={copy}
        mobileAvailable={mobileAvailable}
        onOtpSent={handleOtpSent}
        purpose={purpose}
      />
    </section>
  );
}
