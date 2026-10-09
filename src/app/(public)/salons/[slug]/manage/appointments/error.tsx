"use client";

import { RouteError } from "@/components/shared/route-error";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Route-level boundary for the salon-side manage-appointments page. */
export default function ManageAppointmentsError(props: ErrorProps) {
  return (
    <RouteError
      {...props}
      title="Could not load your appointments"
      message="Your appointment list did not load. Try again — your bookings and their status are safe."
    />
  );
}
