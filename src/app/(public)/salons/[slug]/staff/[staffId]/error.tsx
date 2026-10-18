"use client";

import { RouteError } from "@/components/shared/route-error";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Route-level boundary for the salon-side staff detail page. */
export default function ManageStaffDetailError(props: ErrorProps) {
  return (
    <RouteError
      {...props}
      title="Could not load this staff member"
      message="Their schedule, leaves, and skills did not load. Try again — nothing here has been changed."
    />
  );
}
