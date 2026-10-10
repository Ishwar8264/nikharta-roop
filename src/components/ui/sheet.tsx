"use client";

import type { ComponentProps } from "react";
import { cn } from "cn";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./dialog";

const Sheet = Dialog;
const SheetTrigger = DialogTrigger;
const SheetClose = DialogClose;
function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
    />
  );
}
function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    />
  );
}
const SheetTitle = DialogTitle;
const SheetDescription = DialogDescription;

function SheetContent({
  side = "right",
  className,
  ...props
}: ComponentProps<typeof DialogContent> & {
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <DialogContent
      {...props}
      className={cn(
        "flex flex-col translate-x-0 translate-y-0 rounded-none p-0 sm:max-w-none",
        side === "right" &&
          "inset-y-0 right-0 left-auto h-full w-3/4 border-l sm:max-w-sm",
        side === "left" && "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        side === "top" && "inset-x-0 top-0 max-w-full border-b",
        side === "bottom" && "inset-x-0 top-auto bottom-0 max-w-full border-t",
        className,
      )}
    />
  );
}
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
