"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary. Client component by Next.js contract — React
 * requires error boundaries to be class-based (client) under the hood.
 */
export default function SalonDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Surface in the browser console; server-side logging happens in the
    // service layer where the original stack is still intact.
    console.error("Salon detail failed to render", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h2 className="font-heading text-xl font-semibold">
          Could not load this salon
        </h2>
        <p className="text-sm text-muted-foreground">
          Something went wrong on our side. Try again — if it keeps failing, the
          salon may be temporarily unavailable.
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
