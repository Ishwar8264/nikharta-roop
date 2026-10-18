"use client";

import { Check } from "lucide-react";
import { Checkbox as CheckboxPrimitive, composeRenderProps, type CheckboxProps } from "react-aria-components";
import { cn } from "@/lib/utils";

/** Accessible checkbox with a consistent checked indicator and focus state. */
export function Checkbox({ children, className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive {...props} className={composeRenderProps(className, (value) => cn("group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 outline-none transition-colors hover:bg-muted data-selected:bg-primary/5 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-visible:ring-2 data-focus-visible:ring-ring", value))}>
      {composeRenderProps(children, (content, { isSelected, isIndeterminate }) => <>
        <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center rounded border border-input bg-background group-data-selected:border-primary group-data-selected:bg-primary group-data-selected:text-primary-foreground">
          {isIndeterminate ? <span className="h-0.5 w-2 bg-current" /> : isSelected ? <Check className="size-3" strokeWidth={3} /> : null}
        </span>
        {content}
      </>)}
    </CheckboxPrimitive>
  );
}
