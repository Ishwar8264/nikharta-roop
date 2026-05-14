"use client";

import type * as React from "react";

type ResendOtpControlProps = {
  canResend: boolean;
  cooldown: number;
  isResending: boolean;
  onResend: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

// Keeps resend copy and disabled state in one tiny presentational component.
export function ResendOtpControl({
  canResend,
  cooldown,
  isResending,
  onResend,
}: ResendOtpControlProps) {
  const label = isResending
    ? "Resending..."
    : cooldown > 0
      ? `Resend OTP in ${cooldown}s`
      : "Resend OTP";

  return (
    <p className="text-center text-sm text-muted-foreground">
      Didn&apos;t receive the code?{" "}
      <button
        type="button"
        className="font-medium text-primary underline-offset-4 hover:underline"
        disabled={!canResend}
        onClick={onResend}
      >
        {label}
      </button>
    </p>
  );
}
