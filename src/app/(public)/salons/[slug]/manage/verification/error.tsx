"use client";

import { RouteError } from "@/components/shared/route-error";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Route-level boundary for the owner verification page. */
export default function ManageVerificationError(props: ErrorProps) {
  return (
    <RouteError
      {...props}
      title="Could not load verification"
      message="Your verification status did not load. Try again — your submitted documents are still safe."
    />
  );
}
