"use client";

import { useTheme } from "next-themes";
import {
  Toaster as SonnerToaster,
  type ToasterProps,
} from "sonner";

// Render the single shadcn Sonner host used by every application toast.
export function Toaster({
  position = "top-right",
  ...props
}: ToasterProps) {
  // Read the saved Light, Dark, or System preference from the root provider.
  const { theme = "system" } = useTheme();

  // Keep toast placement global while custom content owns its visual styling.
  return (
    <SonnerToaster
      className="toaster group"
      position={position}
      theme={theme as ToasterProps["theme"]}
      toastOptions={{
        // Remove Sonner defaults so shared semantic tokens control both themes.
        unstyled: true,
      }}
      {...props}
    />
  );
}
