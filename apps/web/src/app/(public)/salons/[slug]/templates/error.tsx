"use client";

import { RouteError } from "@/components/shared/route-error";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Route-level boundary for catalog activation. */
export default function TemplatesError(props: ErrorProps) {
  return (
    <RouteError
      {...props}
      title="Could not load your catalog"
      message="Your template list did not load. Try again — your saved prices and activations are safe."
    />
  );
}
