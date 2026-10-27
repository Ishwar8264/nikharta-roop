import type { ReactNode } from "react";

import { DesktopNav, MobileNav } from "@/components/navigation";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";

/** Presentational header. The caller can supply account controls without coupling it to auth. */
export function Header({ accountControls }: { accountControls?: ReactNode }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        <Brand size="sm" />
        <DesktopNav />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {accountControls}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
