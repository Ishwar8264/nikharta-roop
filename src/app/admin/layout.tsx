import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Brand } from "@/components/shared/brand";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/routes";
import { getSession } from "@/lib/auth/get-session";

export const metadata: Metadata = {
  title: "Admin | Nikharta Roop",
  robots: { index: false, follow: false },
};

/**
 * Admin section chrome — SUPER_ADMIN only.
 *
 * Why `notFound()` instead of `redirect("/login")`:
 * Surfacing a 404 to non-admins (signed-in or not) hides the existence of the
 * admin surface entirely. Redirecting to login would leak that an admin area
 * exists at this URL. The proxy already gates `/api/v1/admin/*`; this layout
 * is the defense-in-depth second door for the page tree.
 *
 * Why minimal chrome:
 * The admin area is internal tooling, not a customer surface. The brand link
 * and salon-directory link are enough — the rest of the chrome (footer, nav,
 * search) would be noise on a screen used to make verification decisions.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSession();
  if (!user || user.role !== "SUPER_ADMIN") notFound();

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Brand size="sm" href={routes.home} />
            <Badge variant="secondary">Admin</Badge>
          </div>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <Link
              href={routes.adminSalonVerification}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Verification queue
            </Link>
            <Link
              href={routes.adminUsers}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Users
            </Link>
            <Link
              href={routes.adminCoupons}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Coupons
            </Link>
            <Link
              href={routes.adminAiUsage}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              AI usage
            </Link>
            <Link
              href={routes.adminAuditLogs}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Audit logs
            </Link>
            <Link
              href={routes.salons}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Salon directory
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
