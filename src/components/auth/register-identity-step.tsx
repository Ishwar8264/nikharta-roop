"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ApiClientError } from "@/src/lib/api-client";
import { registerUser } from "@/src/services/auth/auth.client";
import type { RegisterInput } from "@/src/types/auth";
import { registerSchema } from "@/src/validations/auth/auth.validation";

// Keep supported signup channels explicit for safe conditional rendering.
type RegisterChannel = "EMAIL" | "MOBILE";

// Receive server capability and report successful OTP delivery to the flow.
type RegisterIdentityStepProps = {
  mobileRegistrationAvailable: boolean;
  onOtpSent: (identity: RegisterInput, message: string) => void;
};

// Collect and submit one supported email or mobile signup identity.
export function RegisterIdentityStep({
  mobileRegistrationAvailable,
  onOtpSent,
}: RegisterIdentityStepProps) {
  // Start with email because production delivery is currently supported.
  const [channel, setChannel] = useState<RegisterChannel>("EMAIL");

  // Store API errors separately from field-level Zod validation messages.
  const [apiError, setApiError] = useState<string | null>(null);

  // Connect the shared register schema to typed client-side form validation.
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "" },
    shouldUnregister: true,
  });

  // Reset incompatible field data whenever the user changes signup channel.
  const handleChannelChange = (nextChannel: RegisterChannel) => {
    // Skip unavailable mobile registration and unchanged selections.
    if (
      nextChannel === channel ||
      (nextChannel === "MOBILE" && !mobileRegistrationAvailable)
    ) {
      return;
    }

    // Render the newly selected input and its matching label.
    setChannel(nextChannel);

    // Remove stale backend feedback from the previous identity attempt.
    setApiError(null);

    // Reset values and errors while keeping exactly one supported identity.
    reset(nextChannel === "EMAIL" ? { email: "" } : { mobile: "" });
  };

  // Send the normalized form payload through the reusable auth API service.
  const handleRegister = async (input: RegisterInput) => {
    // Clear stale request feedback before starting a new submission.
    setApiError(null);

    try {
      // Request one SIGNUP OTP using the identity validated by Zod.
      const result = await registerUser(input);

      // Advance only after the server confirms successful OTP delivery.
      onOtpSent(input, result.message);
    } catch (error) {
      // Preserve expected backend and network messages from the shared client.
      if (error instanceof ApiClientError) {
        setApiError(error.message);

        // Stop before applying the unknown-error fallback.
        return;
      }

      // Hide unexpected implementation details behind one safe message.
      setApiError("Something went wrong. Please try again.");
    }
  };

  // Read the visible field error without duplicating conditional checks in JSX.
  const identityError =
    channel === "EMAIL" ? errors.email?.message : errors.mobile?.message;

  // Keep the label aligned with the selected authentication channel.
  const identityLabel = channel === "EMAIL" ? "Email address" : "Mobile number";

  // Keep examples channel-specific so expected input format is immediately clear.
  const identityPlaceholder =
    channel === "EMAIL" ? "you@example.com" : "9876543210";

  // Mention only authentication channels the current server can deliver.
  const identityDescription = mobileRegistrationAvailable
    ? "Choose email or mobile and we'll send you a verification code."
    : "Enter your email and we'll send you a verification code.";

  // Render the focused identity step inside the shared authentication card.
  return (
    <section aria-labelledby="signup-heading">
      {/* Introduce the form with clear salon branding and OTP expectations. */}
      <div className="text-center">
        {/* Use the editorial font for the primary authentication heading. */}
        <h1
          className="font-display text-3xl font-semibold tracking-[-0.025em]"
          id="signup-heading"
        >
          Create your account
        </h1>

        {/* Explain why the user only needs one identity at this stage. */}
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {identityDescription}
        </p>
      </div>

      {/* Show channel selection only when every displayed option can deliver OTPs. */}
      {mobileRegistrationAvailable ? (
        <div
          aria-label="Registration method"
          className="mt-8 grid grid-cols-2 gap-2 rounded-xl bg-surface-soft p-1"
          role="group"
        >
          {/* Select email registration without retaining mobile input. */}
          <button
            aria-pressed={channel === "EMAIL"}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              channel === "EMAIL"
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => handleChannelChange("EMAIL")}
            type="button"
          >
            {/* Reinforce the email channel with a familiar visual cue. */}
            <Mail aria-hidden="true" className="size-4" />
            Email
          </button>

          {/* Select development mobile registration only when the server supports it. */}
          <button
            aria-pressed={channel === "MOBILE"}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              channel === "MOBILE"
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => handleChannelChange("MOBILE")}
            type="button"
          >
            {/* Reinforce the mobile channel with a familiar visual cue. */}
            <Phone aria-hidden="true" className="size-4" />
            Mobile
          </button>
        </div>
      ) : null}

      {/* Validate locally before sending the register request to the API. */}
      <form
        className="mt-6 space-y-5"
        onSubmit={handleSubmit(handleRegister)}
        noValidate
      >
        {/* Keep the active identity label and input grouped for accessibility. */}
        <div>
          {/* Describe the currently visible identity field. */}
          <label className="text-sm font-semibold" htmlFor="register-identity">
            {identityLabel}
          </label>

          {/* Register only the active field so the API never receives both identities. */}
          {channel === "EMAIL" ? (
            <input
              aria-describedby={
                identityError ? "register-identity-error" : undefined
              }
              aria-invalid={Boolean(identityError)}
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/30"
              id="register-identity"
              inputMode="email"
              placeholder={identityPlaceholder}
              type="email"
              {...register("email")}
            />
          ) : (
            <input
              aria-describedby={
                identityError
                  ? "register-identity-error"
                  : "register-mobile-help"
              }
              aria-invalid={Boolean(identityError)}
              autoComplete="tel"
              className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/30"
              id="register-identity"
              inputMode="numeric"
              maxLength={10}
              placeholder={identityPlaceholder}
              type="tel"
              {...register("mobile")}
            />
          )}

          {/* Show the shared Zod validation message beside the active field. */}
          {identityError ? (
            <p className="mt-2 text-sm text-destructive" id="register-identity-error">
              {identityError}
            </p>
          ) : channel === "MOBILE" ? (
            // Explain the exact mobile format before the user submits the form.
            <p className="mt-2 text-xs text-muted-foreground" id="register-mobile-help">
              Enter a 10-digit Indian mobile number.
            </p>
          ) : null}
        </div>

        {/* Announce backend errors without replacing their useful original message. */}
        {apiError ? (
          <div
            aria-live="polite"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {apiError}
          </div>
        ) : null}

        {/* Submit one request while clearly communicating the pending state. */}
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {/* Replace the action icon with an animated loader during submission. */}
          {isSubmitting ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <ArrowRight aria-hidden="true" className="size-4" />
          )}

          {/* Keep the pending action understandable without relying on the icon. */}
          {isSubmitting ? "Sending OTP..." : "Continue"}
        </button>
      </form>

      {/* Help existing customers reach the dedicated login flow. */}
      <p className="mt-7 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        {/* Use client navigation so switching auth pages stays fast. */}
        <Link className="font-semibold text-primary hover:underline" href="/login">
          Log in
        </Link>
      </p>
    </section>
  );
}
