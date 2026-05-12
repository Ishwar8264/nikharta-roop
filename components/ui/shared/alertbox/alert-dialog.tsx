"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  type DialogSize,
} from "@/components/ui/shared/dialogbox/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Info, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────
type AlertVariant = "default" | "info" | "success" | "warning" | "danger";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: AlertVariant;
  icon?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  size?: DialogSize;
  showCancel?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// ─── Variant Config (Premium Polish) ─────────────────────
const variants: Record<
  AlertVariant,
  { icon?: React.ReactNode; btn: string; iconBg: string; border: string }
> = {
  default: {
    icon: undefined,
    btn: "bg-foreground text-background hover:bg-foreground/90 shadow-sm hover:shadow-md",
    iconBg: "",
    border: "",
  },
  info: {
    icon: <Info className="size-5 stroke-[1.5]" />,
    btn: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-blue-200 transition-all",
    iconBg: "bg-blue-50 text-blue-600 ring-4 ring-blue-50/50",
    border: "border-l-[6px] border-l-blue-500",
  },
  success: {
    icon: <CheckCircle className="size-5 stroke-[1.5]" />,
    btn: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-emerald-200 transition-all",
    iconBg: "bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50/50",
    border: "border-l-[6px] border-l-emerald-500",
  },
  warning: {
    icon: <AlertTriangle className="size-5 stroke-[1.5]" />,
    btn: "bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow-amber-200 transition-all",
    iconBg: "bg-amber-50 text-amber-600 ring-4 ring-amber-50/50",
    border: "border-l-[6px] border-l-amber-500",
  },
  danger: {
    icon: <AlertCircle className="size-5 stroke-[1.5]" />,
    btn: "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-red-200 transition-all",
    iconBg: "bg-red-50 text-red-600 ring-4 ring-red-50/50",
    border: "border-l-[6px] border-l-red-500",
  },
};

// ─── Spinner ─────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="mr-2 size-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── AlertDialog ─────────────────────────────────────────
function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = "default",
  icon,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  size = "sm",
  showCancel = true,
  className,
  children,
}: AlertDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const v = variants[variant];
  const displayIcon = icon ?? v.icon;

  const handleConfirm = async () => {
    if (!onConfirm) {
      onOpenChange(false);
      return;
    }
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // stay open on error
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size={size}
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()} // ← blocks outside click
        onEscapeKeyDown={(e) => e.preventDefault()} // ← blocks Esc key
        className={cn(
          "gap-6 p-7 rounded-2xl shadow-xl",
          "bg-white/95 backdrop-blur-xl",
          v.border,
          className,
        )}
      >
        {displayIcon ? (
          <div className="flex gap-4 items-start">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl",
                "transition-all duration-300",
                v.iconBg,
              )}
            >
              {displayIcon}
            </div>
            <div className="flex-1 space-y-1.5 pt-1">
              <DialogTitle className="text-gray-900 text-base font-semibold tracking-tight">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-gray-500 text-[13px] leading-relaxed">
                  {description}
                </DialogDescription>
              )}
              {children}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <DialogTitle className="text-gray-900 text-base font-semibold tracking-tight">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-gray-500 text-[13px] leading-relaxed">
                {description}
              </DialogDescription>
            )}
            {children}
          </div>
        )}

        <DialogFooter
          className={cn(
            "pt-2 -mx-7 -mb-7 rounded-b-2xl bg-gray-50/60",
            displayIcon ? "ml-0" : "",
          )}
        >
          {showCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="border-0 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg shadow-none transition-all"
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "font-medium rounded-lg transition-all duration-200",
              v.btn || "bg-foreground text-background hover:bg-foreground/90",
            )}
          >
            {loading && <Spinner />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { AlertDialog, type AlertDialogProps, type AlertVariant };
