"use client";

import * as React from "react";
import {
  Header,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  Popover,
  Separator,
  type MenuItemProps,
  type PopoverProps,
} from "react-aria-components";
import { cn } from "cn";
import { Button } from "./button";

function DropdownMenu({
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
    <MenuTrigger
      isOpen={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      {children}
    </MenuTrigger>
  );
}
function DropdownMenuTrigger(props: React.ComponentProps<typeof Button>) {
  return <Button {...props} />;
}
function DropdownMenuContent({
  className,
  children,
  align = "start",
  side = "bottom",
  alignOffset = 0,
  sideOffset = 4,
  ...props
}: Omit<PopoverProps, "children" | "className"> & {
  children?: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  alignOffset?: number;
  sideOffset?: number;
}) {
  const placement =
    `${side}${align === "center" ? "" : ` ${align}`}` as PopoverProps["placement"];
  return (
    <Popover
      {...props}
      placement={placement}
      offset={sideOffset}
      crossOffset={alignOffset}
      data-slot="dropdown-menu-content"
      className={cn(
        "z-50 max-h-[min(24rem,var(--available-height))] w-(--trigger-width) min-w-32 overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none",
        className,
      )}
    >
      <Menu aria-label="Menu" className="outline-none">
        {children}
      </Menu>
    </Popover>
  );
}
function DropdownMenuGroup(props: React.ComponentProps<typeof MenuSection>) {
  return <MenuSection {...props} />;
}
function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof Header>) {
  return (
    <Header
      className={cn(
        "px-1.5 py-1 text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
function DropdownMenuItem({
  className,
  children,
  disabled,
  render,
  variant = "default",
  inset,
  ...props
}: Omit<MenuItemProps, "className" | "children" | "render"> & {
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  render?: React.ReactElement;
  variant?: "default" | "destructive";
  inset?: boolean;
}) {
  const link = render?.props as
    | { href?: string; className?: string }
    | undefined;
  return (
    <MenuItem
      {...props}
      href={link?.href ?? props.href}
      isDisabled={disabled || props.isDisabled}
      textValue={
        props.textValue ?? (typeof children === "string" ? children : undefined)
      }
      data-slot="dropdown-menu-item"
      data-variant={variant}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-none data-focused:bg-accent data-focused:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        inset && "pl-7",
        variant === "destructive" &&
          "text-destructive data-focused:bg-destructive/10 data-focused:text-destructive",
        className,
        link?.className,
      )}
    >
      {children}
    </MenuItem>
  );
}
function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      {...props}
      className={cn("-mx-1 my-1 h-px border-0 bg-border", className)}
    />
  );
}
function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      {...props}
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className,
      )}
    />
  );
}
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
};
