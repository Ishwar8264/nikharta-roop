"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { showAppToast } from "@/src/components/shared/toast/app-toast";
import { requestAuthOtp } from "@/src/services/auth/auth.client";
import type { AuthIdentifierInput, AuthPurpose } from "@/src/types/auth";
import {
  loginSchema,
  registerSchema,
} from "@/src/validations/auth/auth.validation";
import { getAuthErrorMessage } from "@/src/components/auth/utils/auth-flow";

// Keep supported authentication channels explicit for safe conditional rendering.
export type AuthChannel = "EMAIL" | "MOBILE";

// Configure server capability and successful delivery behavior for the form hook.
type UseAuthIdentityFormOptions = {
  mobileAvailable: boolean;
  onOtpSent: (identity: AuthIdentifierInput) => void;
  purpose: AuthPurpose;
};

// Encapsulate identity form state, validation, and OTP request behavior.
export function useAuthIdentityForm({
  mobileAvailable,
  onOtpSent,
  purpose,
}: UseAuthIdentityFormOptions) {
  // Start with email because production delivery is currently supported.
  const [channel, setChannel] = useState<AuthChannel>("EMAIL");

  // Choose the route-matching schema while preserving one shared field contract.
  const identitySchema = purpose === "LOGIN" ? loginSchema : registerSchema;

  // Connect the API schema to typed React Hook Form validation.
  const form = useForm<AuthIdentifierInput>({
    resolver: zodResolver(identitySchema),
    defaultValues: { email: "" },
    shouldUnregister: true,
  });

  // Reset incompatible data whenever the customer changes identity channel.
  const handleChannelChange = (nextChannel: AuthChannel) => {
    // Skip unavailable mobile requests and unchanged selections.
    if (
      nextChannel === channel ||
      (nextChannel === "MOBILE" && !mobileAvailable)
    ) {
      return;
    }

    // Render the newly selected identity input.
    setChannel(nextChannel);

    // Reset values and errors while keeping exactly one supported identity.
    form.reset(nextChannel === "EMAIL" ? { email: "" } : { mobile: "" });
  };

  // Send the normalized identity through the purpose-specific auth endpoint.
  const handleIdentitySubmit = form.handleSubmit(async (input) => {
    try {
      // Request one OTP using the identity already validated by Zod.
      const result = await requestAuthOtp(input, purpose);

      // Confirm server-reported OTP delivery through the shared heading-based toast.
      showAppToast({
        description: result.message,
        heading: "OTP sent",
        variant: "success",
      });

      // Advance only after the server confirms successful OTP delivery.
      onOtpSent(input);
    } catch (error) {
      // Preserve the backend message inside a purpose-specific error toast.
      showAppToast({
        description: getAuthErrorMessage(error),
        heading: purpose === "LOGIN" ? "Login failed" : "Registration failed",
        variant: "error",
      });
    }
  });

  // Read the active field error without duplicating checks inside JSX.
  const identityError =
    channel === "EMAIL"
      ? form.formState.errors.email?.message
      : form.formState.errors.mobile?.message;

  // Keep field content aligned with the selected authentication channel.
  const field =
    channel === "EMAIL"
      ? {
          autoComplete: "email" as const,
          inputMode: "email" as const,
          label: "Email address",
          name: "email" as const,
          placeholder: "you@example.com",
          type: "email" as const,
        }
      : {
          autoComplete: "tel" as const,
          inputMode: "numeric" as const,
          label: "Mobile number",
          name: "mobile" as const,
          placeholder: "9876543210",
          type: "tel" as const,
        };

  // Expose focused render data while keeping form behavior inside the hook.
  return {
    channel,
    field,
    form,
    handleChannelChange,
    handleIdentitySubmit,
    identityError,
  };
}
