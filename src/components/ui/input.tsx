import * as React from "react";

import { cn } from "@/src/lib/utils";

// Render the shared shadcn input while preserving every native input capability.
function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  // Merge form-specific classes without duplicating the accessible control foundation.
  return (
    <input
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
        className,
      )}
      data-slot="input"
      type={type}
      {...props}
    />
  );
}

// Expose one consistent input primitive across application forms.
export { Input };
