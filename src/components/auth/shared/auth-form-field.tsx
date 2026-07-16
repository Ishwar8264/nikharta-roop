import * as React from "react";

import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

// Extend the native input contract with reusable label and feedback content.
type AuthFormFieldProps = Omit<React.ComponentProps<typeof Input>, "id"> & {
  description?: string;
  error?: string;
  id: string;
  label: string;
};

// Render one accessible auth field without repeating label and error wiring.
export function AuthFormField({
  className,
  description,
  error,
  id,
  label,
  ...inputProps
}: AuthFormFieldProps) {
  // Build stable feedback identifiers from the required input identifier.
  const descriptionId = `${id}-description`;

  // Keep validation feedback addressable by assistive technology.
  const errorId = `${id}-error`;

  // Start without feedback when neither an error nor description exists.
  let describedBy: string | undefined;

  // Prioritize the active validation error over passive helper text.
  if (error) {
    describedBy = errorId;
  } else if (description) {
    // Connect passive format guidance only when no active error exists.
    describedBy = descriptionId;
  }

  // Keep the label, input, and matching feedback in one reusable group.
  return (
    <div className="space-y-2">
      {/* Associate the visible label with the native input identifier. */}
      <Label htmlFor={id}>{label}</Label>

      {/* Forward native and React Hook Form props into the shadcn input. */}
      <Input
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={className}
        id={id}
        {...inputProps}
      />

      {/* Show the active Zod message or the optional format guidance. */}
      {error ? (
        <p className="text-sm text-destructive" id={errorId}>
          {error}
        </p>
      ) : description ? (
        <p className="text-xs text-muted-foreground" id={descriptionId}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
