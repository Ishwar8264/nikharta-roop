"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import type { UploadedImage } from "../types";
import { MediaPicker } from "./media-picker";

interface MediaPickerDialogProps {
  title?: string;
  description?: string;
  value: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  mode?: "single" | "multiple";
  max?: number;
  maxSizeMB?: number;
  accept?: string[];
  defaultTab?: "upload" | "library";
  disabled?: boolean;
  trigger: React.ReactNode;
  contentClassName?: string;
  triggerClassName?: string;
}

export function MediaPickerDialog({
  title = "Add media",
  description,
  value,
  onChange,
  mode = "multiple",
  max = 10,
  maxSizeMB = 5,
  accept,
  defaultTab = "upload",
  disabled,
  trigger,
  contentClassName,
  triggerClassName,
}: MediaPickerDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "block w-full",
          disabled && "pointer-events-none opacity-50",
          triggerClassName,
        )}
      >
        {trigger}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "flex max-h-[90vh] w-[calc(100vw-2rem)] flex-col gap-0 p-0",
            "sm:w-full sm:max-w-5xl",
            contentClassName,
          )}
        >
          {/* ─── Header with explicit close button ─── */}
          <DialogHeader className="flex shrink-0 flex-row items-start justify-between gap-4 border-b border-border px-5 py-4 text-left sm:px-6">
            <div className="min-w-0 flex-1">
              <DialogTitle>{title}</DialogTitle>
              {description ? (
                <DialogDescription className="mt-1">
                  {description}
                </DialogDescription>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close dialog"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </DialogHeader>

          {/* ─── Body — scrollable ─── */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
            <MediaPicker
              value={value}
              onChange={onChange}
              onUploadComplete={() => setOpen(false)}
              mode={mode}
              max={max}
              maxSizeMB={maxSizeMB}
              accept={accept}
              defaultTab={defaultTab}
              disabled={disabled}
            />
          </div>

          {/* ─── Footer — always visible ─── */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-3 sm:px-6">
            <p className="text-sm font-medium text-foreground">
              {value.length} item{value.length === 1 ? "" : "s"} selected
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange([])}
                disabled={value.length === 0}
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setOpen(false)}
                className="gap-1.5"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Confirm selection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
