import Link from "next/link";

import { DesktopNav, MobileNav } from "@/components/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { AuthButtons } from "@/features/auth/components/authButtons";
import { UserMenu } from "@/features/auth/components/userMenu";
import { getSession } from "@/lib/auth/get-session";

/**
 * Public site header.
 *
 * Why server:
 * Composes interactive islands (DesktopNav, ThemeToggle, MobileNav, and
 * either UserMenu or AuthButtons). Itself has no state — reads the session
 * once and hands the user to the correct client island.
 *
 * Why getSession() here and in the root layout:
 * Both calls hit React's cache() — the second one is free.
 */
export async function Header() {
  const user = await getSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          href={routes.home}
          className="font-heading text-lg font-bold tracking-tight"
        >
          {siteConfig.name}
        </Link>

        <DesktopNav />

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? <UserMenu user={user} /> : <AuthButtons />}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
