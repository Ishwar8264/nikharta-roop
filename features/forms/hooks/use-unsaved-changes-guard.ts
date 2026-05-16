"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

// Guards browser unload and in-app anchor navigation while a form is dirty.
export function useUnsavedChangesGuard(enabled: boolean) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  // Browsers only allow their native prompt during refresh or tab close.
  React.useEffect(() => {
    if (!enabled) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);

  // Capture same-origin links before Next.js starts client navigation.
  React.useEffect(() => {
    if (!enabled) return;

    function handleDocumentClick(event: MouseEvent) {
      const anchor = getInternalAnchor(event.target);
      const href = anchor ? getGuardedHref(anchor) : null;

      if (!href) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingHref(href);
      setIsDialogOpen(true);
    }

    document.addEventListener("click", handleDocumentClick, true);

    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [enabled]);

  // Continues the blocked navigation only after explicit discard confirmation.
  function discardChanges() {
    if (pendingHref) router.push(pendingHref);
    setPendingHref(null);
  }

  return { discardChanges, isDialogOpen, setIsDialogOpen };
}

// Finds the nearest clicked link when icons or nested spans receive the click.
function getInternalAnchor(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;

  return target.closest<HTMLAnchorElement>("a[href]");
}

// Ignores external, download, new-tab, and same-page links.
function getGuardedHref(anchor: HTMLAnchorElement) {
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return null;

  const targetUrl = new URL(anchor.href, window.location.href);
  const currentUrl = new URL(window.location.href);

  if (targetUrl.origin !== currentUrl.origin) return null;
  if (targetUrl.href === currentUrl.href) return null;

  return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
}
