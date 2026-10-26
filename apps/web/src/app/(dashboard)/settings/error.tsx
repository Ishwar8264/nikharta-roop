"use client";

import { RouteError } from "@/components/shared/route-error";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Route-level boundary for the settings page. */
export default function SettingsError(props: ErrorProps) {
  return (
    <RouteError
      {...props}
      title="Could not load your settings"
      message="Your settings did not load. Try again — your account is safe."
    />
  );
}
