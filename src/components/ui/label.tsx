"use client";

import { Label as LabelPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/src/lib/utils";

// Render an accessible Radix label with the shared shadcn visual treatment.
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  // Preserve Radix label behavior while allowing focused feature-level spacing.
  return (
    <LabelPrimitive.Root
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-semibold select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      data-slot="label"
      {...props}
    />
  );
}

// Expose one accessible label primitive for every shared field.
export { Label };
