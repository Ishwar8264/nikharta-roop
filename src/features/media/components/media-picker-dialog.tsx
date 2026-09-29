"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { UploadedImage } from "../types";
import { MediaPicker } from "./media-picker";

interface MediaPickerDialogProps {
  title?: string;
  value: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  mode?: "single" | "multiple";
  max?: number;
  /** Element that opens the dialog. */
  trigger: React.ReactNode;
}

/**
 * Dialog wrapper around MediaPicker.
 *
 * Why controlled `open` state and a clickable wrapper, not DialogTrigger:
 * Base UI's DialogTrigger composes through a `render` prop whose exact
 * shape varies across shadcn presets. A plain controlled `open` flag works
 * with every variant — the trigger is just a click target, and we forward
 * keyboard activation explicitly so it stays accessible.
 */
export function MediaPickerDialog({
  title = "Add Media",
  value,
  onChange,
  mode = "multiple",
  max = 10,
  trigger,
}: MediaPickerDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="inline-flex cursor-pointer"
      >
        {trigger}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <MediaPicker
            value={value}
            onChange={onChange}
            mode={mode}
            max={max}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
