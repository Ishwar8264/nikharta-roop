"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary for the application shell.
 *
 * Why at the root:
 * Without this, any render error outside a route-level boundary shows the
 * default Next.js error screen instead of branded UI with a retry action.
 */
export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Unhandled render error", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h2 className="font-heading text-xl font-semibold">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Try again, or head back to the home
          page.
        </p>
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
