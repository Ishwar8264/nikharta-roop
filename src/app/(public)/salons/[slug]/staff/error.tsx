"use client";

import { RouteError } from "@/components/shared/route-error";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Route-level boundary for the salon-side manage-staff list page. */
export default function ManageStaffError(props: ErrorProps) {
  return (
    <RouteError
      {...props}
      title="Could not load your team"
      message="Your staff list did not load. Try again — schedules and leave requests are safe."
    />
  );
}
