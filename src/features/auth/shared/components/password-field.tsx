"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Password input with a show/hide toggle.
 *
 * Why "use client":
 * The toggle holds `useState`. There's no way to render this server-side
 * without shipping the state to the client anyway — so we accept the small
 * bundle cost here instead of paying it in every consumer form.
 *
 * Why not extend Field:
 * Field's input is a plain <Input>. This needs a positioned button and a
 * wrapper — the markup diverges too much to share cleanly. A tiny duplication
 * beats a component with five conditional slots.
 */
interface PasswordFieldProps {
  id: string;
  label: string;
  autoComplete?: "new-password" | "current-password";
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function PasswordField({
  id,
  label,
  autoComplete = "new-password",
  placeholder,
  error,
  disabled,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
