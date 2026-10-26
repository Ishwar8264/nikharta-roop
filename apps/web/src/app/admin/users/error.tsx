"use client";

import { RouteError } from "@/components/shared/route-error";

/** Admin users error boundary. */
export default function AdminUsersError({
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
      title="Couldn't load users"
      message="We couldn't fetch the user list. Try again — if it keeps failing, the admin team has been notified."
    />
  );
}
