"use client";

import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  Heading,
  Popover as AriaPopover,
  type PopoverProps,
} from "react-aria-components";
import { cn } from "cn";
import { Button } from "./button";

function Popover({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <DialogTrigger
      isOpen={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      {children}
    </DialogTrigger>
  );
}
function PopoverTrigger(props: React.ComponentProps<typeof Button>) {
  return <Button {...props} />;
}
function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  children,
  ...props
}: Omit<PopoverProps, "className" | "children"> & {
  className?: string;
  children?: React.ReactNode;
  align?: "start" | "center" | "end";
  alignOffset?: number;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
}) {
  const placement =
    `${side}${align === "center" ? "" : ` ${align}`}` as PopoverProps["placement"];
  return (
    <AriaPopover
      {...props}
      placement={placement}
      offset={sideOffset}
      crossOffset={alignOffset}
      data-slot="popover-content"
      className={cn(
        "z-50 w-72 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none",
        className,
      )}
    >
      <Dialog className="flex flex-col gap-2.5 outline-none">{children}</Dialog>
    </AriaPopover>
  );
}
function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-0.5 text-sm", className)}
      {...props}
    />
  );
}
function PopoverTitle({
  className,
  ...props
}: React.ComponentProps<typeof Heading>) {
  return (
    <Heading
      slot="title"
      data-slot="popover-title"
      className={cn("font-medium", className)}
      {...props}
    />
  );
}
function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
};
