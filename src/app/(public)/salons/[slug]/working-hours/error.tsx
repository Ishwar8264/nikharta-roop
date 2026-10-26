"use client";

import { RouteError } from "@/components/shared/route-error";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Route-level boundary for the salon working-hours manage page. */
export default function ManageWorkingHoursError(props: ErrorProps) {
  return (
    <RouteError
      {...props}
      title="Could not load your working hours"
      message="Your salon's weekly schedule did not load. Try again — your saved hours are still active."
    />
  );
}
