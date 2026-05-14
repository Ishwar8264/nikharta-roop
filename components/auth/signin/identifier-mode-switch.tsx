"use client";

import * as React from "react";
import { Mail, Phone } from "lucide-react";

import type { IdentifierMode } from "@/components/auth/utils/auth-form-validation";
import { cn } from "@/lib/utils";

const identifierOptions: Array<{
  value: IdentifierMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "mobile",
    label: "Phone",
    icon: Phone,
  },
  {
    value: "email",
    label: "Email",
    icon: Mail,
  },
];

// Kept data-driven so adding another identifier type stays localized.
type IdentifierModeSwitchProps = {
  mode: IdentifierMode;
  onModeChange: (mode: IdentifierMode) => void;
};

// Compact segmented control for choosing phone or email login.
export function IdentifierModeSwitch({
  mode,
  onModeChange,
}: IdentifierModeSwitchProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-stone-950">Login with</p>
      <div className="grid grid-cols-2 rounded-xl border border-input bg-muted/40 p-1">
        {identifierOptions.map((option) => {
          const Icon = option.icon;
          const isActive = mode === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onModeChange(option.value)}
              className={cn(
                "flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-stone-950 shadow-sm"
                  : "text-muted-foreground hover:text-stone-950",
              )}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
