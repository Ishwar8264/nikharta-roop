"use client";

import { RouteError } from "@/components/shared/route-error";

/** Admin audit logs error boundary. */
export default function AdminAuditLogsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Couldn't load audit logs"
      message="We couldn't fetch the audit trail. Try again — if it keeps failing, the admin team has been notified."
    />
  );
}
