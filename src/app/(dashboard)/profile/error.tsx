"use client";

import { RouteError } from "@/components/shared/route-error";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Route-level boundary for the profile page. */
export default function ProfileError(props: ErrorProps) {
  return (
    <RouteError
      {...props}
      title="Could not load your profile"
      message="Your profile did not load. Try again — your account details are safe."
    />
  );
}
