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
interface FieldProps {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  defaultValue?: string;
}

export function Field({
  id,
  label,
  type = "text",
  autoComplete,
  placeholder,
  icon,
  error,
  disabled,
  defaultValue,
}: FieldProps) {
  const errorId = `${id}-error`;

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
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          defaultValue={defaultValue}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "placeholder:text-muted-foreground/80",
            icon && "pl-10!",
          )}
        />
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
