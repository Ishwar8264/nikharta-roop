"use client";

import {
  CircleCheck,
  CircleX,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

// Keep supported toast meanings explicit for consistent icons and colors.
export type AppToastVariant = "error" | "info" | "success" | "warning";

// Configure an optional toast action without exposing Sonner implementation details.
export type AppToastAction = {
  dismissAfterClick?: boolean;
  label: string;
  onClick: () => void;
};

// Define the complete props-driven public API used by feature components.
export type AppToastOptions = {
  action?: AppToastAction;
  description?: string;
  dismissible?: boolean;
  duration?: number;
  heading: string;
  variant?: AppToastVariant;
};

// Add Sonner's generated identifier only inside the rendered toast component.
type AppToastProps = AppToastOptions & {
  toastId: string | number;
};

// Map each semantic variant to one icon and theme-aware color treatment.
const TOAST_VARIANTS = {
  error: {
    borderClassName: "border-destructive/40",
    icon: CircleX,
    iconClassName: "bg-destructive/10 text-destructive",
  },
  info: {
    borderClassName: "border-primary/30",
    icon: Info,
    iconClassName: "bg-primary/10 text-primary",
  },
  success: {
    borderClassName: "border-primary/40",
    icon: CircleCheck,
    iconClassName: "bg-primary/10 text-primary",
  },
  warning: {
    borderClassName: "border-brand-gold/50",
    icon: TriangleAlert,
    iconClassName: "bg-brand-gold/15 text-brand-gold",
  },
} as const;

// Render one custom notification from reusable semantic props.
export function AppToast({
  action,
  description,
  dismissible = true,
  heading,
  toastId,
  variant = "info",
}: AppToastProps) {
  // Read icon and color metadata without scattering variant conditions in JSX.
  const variantConfig = TOAST_VARIANTS[variant];

  // Render the selected Lucide icon through one stable component reference.
  const VariantIcon = variantConfig.icon;

  // Run the optional action and dismiss unless the caller explicitly keeps it open.
  const handleAction = () => {
    // Execute the caller-owned behavior before changing notification state.
    action?.onClick();

    // Keep the toast visible only when the action explicitly requests it.
    if (action?.dismissAfterClick !== false) {
      toast.dismiss(toastId);
    }
  };

  // Render an accessible card that automatically follows semantic theme tokens.
  return (
    <div
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-salon",
        variantConfig.borderClassName,
      )}
      role={variant === "error" ? "alert" : "status"}
    >
      {/* Give every toast type a distinct but theme-safe visual marker. */}
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          variantConfig.iconClassName,
        )}
      >
        <VariantIcon aria-hidden="true" className="size-4" />
      </span>

      {/* Keep heading, description, and optional action inside one flexible column. */}
      <div className="min-w-0 flex-1">
        {/* Make the required heading the strongest notification content. */}
        <p className="text-sm font-semibold leading-5">{heading}</p>

        {/* Render supporting context only when the caller supplies it. */}
        {description ? (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}

        {/* Render one optional action with shared button behavior and styling. */}
        {action ? (
          <Button
            className="mt-3"
            onClick={handleAction}
            size="sm"
            type="button"
            variant="outline"
          >
            {action.label}
          </Button>
        ) : null}
      </div>

      {/* Keep a clear close icon on every dismissible notification. */}
      {dismissible ? (
        <Button
          aria-label="Close notification"
          className="-mt-1 -mr-1 size-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => toast.dismiss(toastId)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}

// Show one application toast without exposing raw Sonner calls to features.
export function showAppToast({
  dismissible = true,
  duration = 4000,
  ...options
}: AppToastOptions) {
  // Let Sonner own timing and stacking while AppToast owns visible content.
  return toast.custom(
    (toastId) => (
      <AppToast
        dismissible={dismissible}
        toastId={toastId}
        {...options}
      />
    ),
    {
      dismissible,
      duration,
    },
  );
}
