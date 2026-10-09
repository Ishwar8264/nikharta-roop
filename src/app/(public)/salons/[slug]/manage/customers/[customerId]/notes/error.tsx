"use client";

import { RouteError } from "@/components/shared/route-error";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Route-level boundary for the customer notes timeline. */
export default function CustomerNotesError(props: ErrorProps) {
  return (
    <RouteError
      {...props}
      title="Could not load customer notes"
      message="The notes timeline did not load. Try again — your existing notes are safe."
    />
  );
}
