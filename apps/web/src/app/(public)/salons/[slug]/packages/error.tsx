"use client";

import { RouteError } from "@/components/shared/route-error";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Route-level boundary for the public packages page. */
export default function PackagesError(props: ErrorProps) {
  return (
    <RouteError
      {...props}
      title="Could not load packages"
      message="This salon's packages did not load. Try again in a moment."
    />
  );
}
