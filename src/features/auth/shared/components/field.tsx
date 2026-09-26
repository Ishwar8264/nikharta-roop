import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  error,
  disabled,
  defaultValue,
}: FieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
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
      />
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
