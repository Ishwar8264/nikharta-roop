import { CheckCircle2 } from "lucide-react";

// Configure one accessible request message as success or failure feedback.
type AuthFeedbackProps = {
  message?: string | null;
  variant?: "error" | "success";
};

// Render consistent API feedback while preserving the backend-provided message.
export function AuthFeedback({
  message,
  variant = "error",
}: AuthFeedbackProps) {
  // Avoid adding an empty live region when no request feedback exists.
  if (!message) {
    return null;
  }

  // Style success and error feedback through the existing semantic theme tokens.
  const className =
    variant === "success"
      ? "border-primary/30 bg-primary/10 text-foreground"
      : "border-destructive/30 bg-destructive/10 text-destructive";

  // Announce request results without forcing keyboard focus away from the form.
  return (
    <div
      aria-live="polite"
      className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${className}`}
      role={variant === "error" ? "alert" : "status"}
    >
      {/* Distinguish successful delivery from validation or API errors. */}
      {variant === "success" ? (
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-primary"
        />
      ) : null}

      {/* Preserve the validated backend response instead of replacing its meaning. */}
      <span>{message}</span>
    </div>
  );
}
