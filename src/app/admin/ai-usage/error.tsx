"use client";

import { RouteError } from "@/components/shared/route-error";

/** Admin AI usage error boundary. */
export default function AdminAiUsageError({
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
      title="Couldn't load AI usage"
      message="We couldn't fetch the AI usage stats or logs. Try again — if it keeps failing, the admin team has been notified."
    />
  );
}
