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
  icon?: React.ReactNode;
  error?: string;
  disabled?: boolean;
}

export function PasswordField({
  id,
  label,
  autoComplete = "new-password",
  placeholder,
  icon,
  error,
  disabled,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
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
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          className={icon ? "pr-12! pl-10!" : "pr-12!"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          className="absolute right-1 top-0 h-full w-10 hover:bg-transparent"
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
