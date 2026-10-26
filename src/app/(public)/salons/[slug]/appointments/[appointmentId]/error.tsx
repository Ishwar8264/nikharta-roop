"use client";

import { RouteError } from "@/components/shared/route-error";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level boundary for the salon-side appointment detail page.
 *
 * Why a branded retry:
 * The salon owner's most common failure here is a transient DB blip or an
 * expired cookie mid-session — both recoverable by re-running the page. The
 * 404 cases (bad slug, bad appointmentId, salon-ownership mismatch) bypass
 * this boundary entirely because `notFound()` renders Next.js' built-in
 * `not-found.tsx`, not `error.tsx`.
 */
export default function ManageSalonAppointmentDetailError(props: ErrorProps) {
  return (
    <RouteError
      {...props}
      title="Could not load this appointment"
      message="This appointment detail did not load. Try again — the appointment itself is unaffected."
    />
  );
}
