"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  message?: string;
}

/**
 * Branded retry boundary shared by every async route segment.
 *
 * Why one component:
 * Every route deserves the same recovery UX — an icon, a human sentence,
 * and one button. Copying the whole boundary into ten files lets the copies
 * drift; the only per-route differences are the two strings.
 */
export function RouteError({
  error,
  reset,
  title = "Something went wrong",
  message = "This page could not load. Try again — if it keeps failing, please check back in a few minutes.",
}: RouteErrorProps) {
  useEffect(() => {
    // Server-side logging already happened in the service layer; this keeps
    // the browser console useful during development.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h2 className="font-heading text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      <Button onClick={reset} className="gap-1.5">
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Try again
      </Button>

      {error.digest ? (
        <p className="text-[11px] text-muted-foreground">
          Reference: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
