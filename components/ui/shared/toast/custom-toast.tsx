/**
 * Purpose: Shared Sonner toast wrappers with Nikharta Roop visual variants.
 * Responsibilities: render dismissible custom toast content and expose convenience helpers.
 * Important notes: helper functions keep toast calls consistent across client components.
 */
"use client";

import { toast } from "sonner";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Variants Color Map
// ─────────────────────────────────────────────

const variants = {
  default:
    "bg-white text-stone-800 border-stone-200 shadow-md dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700",
  success:
    "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-md dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  error:
    "bg-red-50 text-red-800 border-red-200 shadow-md dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  warning:
    "bg-amber-50 text-amber-800 border-amber-200 shadow-md dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  info: "bg-blue-50 text-blue-800 border-blue-200 shadow-md dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
};

// ─────────────────────────────────────────────
// Custom Toast Component
// ─────────────────────────────────────────────

interface CustomToastProps {
  id?: string | number; // Sonner automatically injects this
  title: string;
  description?: string;
  variant?: keyof typeof variants;
}

export function CustomToast({
  id,
  title,
  description,
  variant = "default",
}: CustomToastProps) {
  return (
    <div
      className={cn(
        "flex w-105 max-w-[90vw] items-start gap-3 rounded-sm border px-3 py-2",
        variants[variant],
      )}
    >
      {/* ── Close Button (Left Side) ── */}
      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        className={cn(
          "mt-1.5 flex size-7 shrink-0 items-center justify-center rounded-full",
          "border border-border/50 bg-transparent text-muted-foreground",
          "transition-all hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
          "focus:outline-none focus:ring-2 focus:ring-ring",
        )}
        aria-label="Close"
      >
        <X className="size-3.5" strokeWidth={2.5} />
      </button>

      {/* ── Text Content ── */}
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        {description && (
          <p className="text-xs opacity-80 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Helper Functions (Easy to use anywhere)
// ─────────────────────────────────────────────

export const showToast = (
  title: string,
  description?: string,
  variant: keyof typeof variants = "default",
) => {
  return toast.custom(
    (id) => (
      <CustomToast
        description={description}
        id={id}
        title={title}
        variant={variant}
      />
    ),
    { unstyled: true },
  );
};

export const showSuccess = (title: string, description?: string) =>
  showToast(title, description, "success");

export const showError = (title: string, description?: string) =>
  showToast(title, description, "error");

export const showWarning = (title: string, description?: string) =>
  showToast(title, description, "warning");

export const showInfo = (title: string, description?: string) =>
  showToast(title, description, "info");
