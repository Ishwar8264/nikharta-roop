"use client";

import type { ComponentProps, ReactNode } from "react";

import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface SharedDialogContentProps extends Omit<ComponentProps<typeof DialogContent>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  /** Caller supplies buttons and handlers for confirmations, alerts, or custom actions. */
  footer?: ReactNode;
  headerProps?: ComponentProps<typeof DialogHeader>;
  titleProps?: Omit<ComponentProps<typeof DialogTitle>, "children">;
  descriptionProps?: Omit<ComponentProps<typeof DialogDescription>, "children">;
  footerProps?: Omit<ComponentProps<typeof DialogFooter>, "children">;
}

/** Shared dialog layout. Use inside Dialog; its caller owns open state, triggers and business logic. */
export function SharedDialogContent({
  title, description, footer, children, className, showCloseButton = true,
  headerProps, titleProps, descriptionProps, footerProps, ...contentProps
}: SharedDialogContentProps) {
  return (
    <DialogContent {...contentProps} showCloseButton={showCloseButton} className={cn("max-h-[85dvh] overflow-y-auto", className)}>
      <DialogHeader {...headerProps} className={cn(showCloseButton && "pr-6", headerProps?.className)}>
        <DialogTitle {...titleProps}>{title}</DialogTitle>
        {description != null && <DialogDescription {...descriptionProps}>{description}</DialogDescription>}
      </DialogHeader>
      {children}
      {footer != null && <DialogFooter {...footerProps}>{footer}</DialogFooter>}
    </DialogContent>
  );
}
