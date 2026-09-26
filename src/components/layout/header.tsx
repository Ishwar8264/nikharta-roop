import { DesktopNav, MobileNav } from "@/components/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";

/**
 * Public site header.
 *
 * Why:
 * A server component that composes three interactive islands (DesktopNav,
 * MobileNav, ThemeToggle) into one stable shell. Because the header itself
 * has no state, it renders on the server and stays out of the client bundle
 * — the only JS that ships is what those islands already needed.
 *
 * Layout: logo left, primary nav centered, actions right. On mobile, the
 * primary nav collapses into the sheet behind the hamburger.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        {/* Center — desktop nav (hidden below lg) */}
        <DesktopNav />

        {/* Right — actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <MobileNav />
        </div>
      </div>
    </header>
  );
}
