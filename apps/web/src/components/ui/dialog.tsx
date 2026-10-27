"use client";

import * as React from "react";
import {
  Dialog as AriaDialog,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import { cn } from "cn";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DialogState {
  open: boolean;
  setOpen: (open: boolean) => void;
}
const DialogContext = React.createContext<DialogState | null>(null);

/** Keep controlled application dialogs independent of their trigger placement. */
function Dialog({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const setOpen = React.useCallback(
    (next: boolean) => {
      setInternalOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );
  const state = React.useMemo(
    () => ({ open: open ?? internalOpen, setOpen }),
    [open, internalOpen, setOpen],
  );
  return (
    <DialogContext.Provider value={state}>{children}</DialogContext.Provider>
  );
}

function useDialogState() {
  const state = React.useContext(DialogContext);
  if (!state) throw new Error("Dialog components must be used inside Dialog");
  return state;
}

function DialogTrigger({
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const state = useDialogState();
  return (
    <Button
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) state.setOpen(true);
      }}
    />
  );
}

function DialogClose({
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const state = useDialogState();
  return (
    <Button
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) state.setOpen(false);
      }}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  overlayClassName,
  ...props
}: Omit<React.ComponentProps<typeof AriaDialog>, "className" | "children"> & {
  className?: string;
  children?: React.ReactNode;
  showCloseButton?: boolean;
  overlayClassName?: string;
}) {
  const state = useDialogState();
  return (
    <ModalOverlay
      isOpen={state.open}
      onOpenChange={state.setOpen}
      isDismissable
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs data-entering:animate-in data-entering:fade-in-0 data-exiting:animate-out data-exiting:fade-out-0",
        overlayClassName,
      )}
    >
      <Modal
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm",
          className,
        )}
      >
        <AriaDialog
          {...props}
          data-slot="dialog-content"
          className="[display:inherit] [gap:inherit] [flex-direction:inherit] h-full min-h-0 w-full outline-none"
        >
          {children}
          {showCloseButton && (
            <DialogClose
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogClose>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && <DialogClose variant="outline">Close</DialogClose>}
    </div>
  );
}
function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof Heading>) {
  return (
    <Heading
      {...props}
      slot="title"
      data-slot="dialog-title"
      className={cn("text-base leading-none font-medium", className)}
    />
  );
}
function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
