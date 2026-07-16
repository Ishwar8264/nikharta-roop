import { ArrowRight, LoaderCircle, Mail, Phone } from "lucide-react";
import Link from "next/link";

import { useAuthIdentityForm } from "@/src/components/auth/hooks/use-auth-identity-form";
import { AuthFormField } from "@/src/components/auth/shared/auth-form-field";
import type { AuthFlowCopy } from "@/src/components/auth/utils/auth-flow";
import { Button } from "@/src/components/ui/button";
import type { AuthIdentifierInput, AuthPurpose } from "@/src/types/auth";

// Configure the shared identity form through serializable server-owned values.
type AuthIdentityStepProps = {
  copy: AuthFlowCopy;
  mobileAvailable: boolean;
  onOtpSent: (identity: AuthIdentifierInput) => void;
  purpose: AuthPurpose;
};

// Collect one email or mobile identity through React Hook Form and Zod.
export function AuthIdentityStep({
  copy,
  mobileAvailable,
  onOtpSent,
  purpose,
}: AuthIdentityStepProps) {
  // Keep field behavior inside the dedicated auth identity hook.
  const {
    channel,
    field,
    form,
    handleChannelChange,
    handleIdentitySubmit,
    identityError,
  } = useAuthIdentityForm({ mobileAvailable, onOtpSent, purpose });

  // Render only the interactive form controls inside the client boundary.
  return (
    <div>
      {/* Show channel selection only when every displayed option can deliver OTPs. */}
      {mobileAvailable ? (
        <div
          aria-label="Authentication method"
          className="mt-8 grid grid-cols-2 gap-2 rounded-xl bg-surface-soft p-1"
          role="group"
        >
          {/* Select email authentication without retaining mobile input. */}
          <Button
            aria-pressed={channel === "EMAIL"}
            onClick={() => handleChannelChange("EMAIL")}
            type="button"
            variant={channel === "EMAIL" ? "secondary" : "ghost"}
          >
            {/* Reinforce the email channel with a familiar visual cue. */}
            <Mail aria-hidden="true" className="size-4" />
            Email
          </Button>

          {/* Select development mobile authentication when delivery is available. */}
          <Button
            aria-pressed={channel === "MOBILE"}
            onClick={() => handleChannelChange("MOBILE")}
            type="button"
            variant={channel === "MOBILE" ? "secondary" : "ghost"}
          >
            {/* Reinforce the mobile channel with a familiar visual cue. */}
            <Phone aria-hidden="true" className="size-4" />
            Mobile
          </Button>
        </div>
      ) : null}

      {/* Validate locally before sending the identity to the Next.js endpoint. */}
      <form
        className="mt-6 space-y-5"
        noValidate
        onSubmit={handleIdentitySubmit}
      >
        {/* Register only the active field so the API never receives both identities. */}
        <AuthFormField
          autoComplete={field.autoComplete}
          description={
            channel === "MOBILE"
              ? "Enter a 10-digit Indian mobile number."
              : undefined
          }
          error={identityError}
          id={`${purpose.toLowerCase()}-identity`}
          inputMode={field.inputMode}
          label={field.label}
          maxLength={channel === "MOBILE" ? 10 : undefined}
          placeholder={field.placeholder}
          type={field.type}
          {...form.register(field.name)}
        />

        {/* Submit only once while communicating React Hook Form pending state. */}
        <Button
          className="w-full"
          disabled={form.formState.isSubmitting}
          size="lg"
          type="submit"
        >
          {/* Replace the action icon with an animated loader during submission. */}
          {form.formState.isSubmitting ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <ArrowRight aria-hidden="true" />
          )}

          {/* Keep request progress understandable without relying on the icon. */}
          {form.formState.isSubmitting
            ? copy.submittingLabel
            : copy.submitLabel}
        </Button>
      </form>

      {/* Help customers move between the dedicated login and signup routes. */}
      <p className="mt-7 text-center text-sm text-muted-foreground">
        {copy.alternatePrompt}{" "}
        {/* Use Next Link for prefetched App Router navigation. */}
        <Link
          className="font-semibold text-primary hover:underline"
          href={copy.alternateHref}
        >
          {copy.alternateAction}
        </Link>
      </p>
    </div>
  );
}
