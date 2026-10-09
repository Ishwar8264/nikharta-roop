import { forwardRef } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Labeled input with an inline error slot.
 *
 * Why no "use client":
 * No hooks, no browser APIs — this renders identically on server and client.
 * Interactive forms import it into their client tree; the bundle pays for
 * the form, not for this atom.
 *
 * Why extracted:
 * Four near-identical blocks per form would drift in spacing, aria wiring,
 * and error rendering. One component keeps the a11y contract in one place.
 */
interface FieldProps
  extends Omit<React.ComponentProps<typeof Input>, "id" | "type"> {
  id: string;
  label: string;
  type?: string;
  icon?: React.ReactNode;
  error?: string;
  /**
   * Optional one-line explanation rendered under the input. Use it to spell
   * out the *impact* of the field (what changes for the customer when this
   * value moves), not just a restatement of the label.
   *
   * Why optional: every existing Field caller passes only `label` + `error`,
   * and forcing a `description` would be a breaking change. Keeping it
   * optional makes this an additive enhancement — no caller needs to touch.
   */
  description?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  {
    id,
    label,
    type = "text",
    icon,
    error,
    description,
    className,
    name,
    "aria-describedby": ariaDescribedBy,
    ...inputProps
  },
  ref,
) {
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;
  const describedBy =
    [
      ariaDescribedBy,
      description ? descriptionId : undefined,
      error ? errorId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {icon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground"
          >
            {icon}
          </span>
        ) : null}
        <Input
          {...inputProps}
          ref={ref}
          id={id}
          name={name ?? id}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "placeholder:text-muted-foreground/80",
            icon && "pl-10!",
            className,
          )}
        />
      </div>
      {description ? (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
});

Field.displayName = "Field";
