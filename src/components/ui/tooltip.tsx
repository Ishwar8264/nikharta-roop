"use client";

import * as React from "react";
import {
  Focusable,
  Tooltip as AriaTooltip,
  TooltipTrigger as AriaTooltipTrigger,
  type TooltipProps,
} from "react-aria-components";
import { cn } from "cn";
import { Button } from "./button";

const DelayContext = React.createContext(0);
function TooltipProvider({
  delay = 0,
  children,
}: {
  delay?: number;
  children?: React.ReactNode;
}) {
  return (
    <DelayContext.Provider value={delay}>{children}</DelayContext.Provider>
  );
}
function Tooltip({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}) {
  const delay = React.useContext(DelayContext);
  return (
    <AriaTooltipTrigger delay={delay} isOpen={open} onOpenChange={onOpenChange}>
      {children}
    </AriaTooltipTrigger>
  );
}
function TooltipTrigger({
  render,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Focusable>
      {render ? (
        React.cloneElement(
          render as React.ReactElement<React.ComponentProps<typeof Button>>,
          props,
          children ?? (render.props as { children?: React.ReactNode }).children,
        )
      ) : (
        <Button {...props}>{children}</Button>
      )}
    </Focusable>
  );
}
function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: Omit<TooltipProps, "className" | "children"> & {
  className?: string;
  children?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  align?: "start" | "center" | "end";
  alignOffset?: number;
}) {
  const placement =
    `${side}${align === "center" ? "" : ` ${align}`}` as TooltipProps["placement"];
  return (
    <AriaTooltip
      {...props}
      placement={placement}
      offset={sideOffset}
      crossOffset={alignOffset}
      data-slot="tooltip-content"
      className={cn(
        "z-50 inline-flex w-fit max-w-xs items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background",
        className,
      )}
    >
      {children}
    </AriaTooltip>
  );
}
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
