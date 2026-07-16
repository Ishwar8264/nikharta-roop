import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import type { AuthFlowCopy } from "@/src/components/auth/utils/auth-flow";
import { Button } from "@/src/components/ui/button";

// Receive purpose-specific success language from the shared flow configuration.
type AuthCompleteProps = {
  copy: AuthFlowCopy;
};

// Render a clear success state after the server establishes auth cookies.
export function AuthComplete({ copy }: AuthCompleteProps) {
  // Confirm completion and offer one direct route into the application.
  return (
    <section aria-labelledby="auth-complete-heading" className="text-center">
      {/* Visually confirm that identity verification and sign-in succeeded. */}
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 aria-hidden="true" className="size-7" />
      </span>

      {/* Give the completed flow one purpose-specific heading. */}
      <h1
        className="font-display mt-5 text-3xl font-semibold tracking-tight"
        id="auth-complete-heading"
      >
        {copy.completeTitle}
      </h1>

      {/* Explain that the protected browser session is already active. */}
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {copy.completeDescription}
      </p>

      {/* Compose Next Link with the Radix-backed shadcn button safely. */}
      <Button asChild className="mt-7 w-full" size="lg">
        <Link href="/">Continue to home</Link>
      </Button>
    </section>
  );
}
