import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Auth route-group layout.
 *
 * Why a route group:
 * Auth pages reuse the public header for consistent navigation while keeping
 * their focused centered form shell and no footer. Parentheses mean `(auth)`
 * does not appear in the URL:
 * `(auth)/register` still resolves to `/register`.
 *
 * Why no "use client":
 * This is a static shell. The only interactive thing inside is the form,
 * which carries its own client boundary. Keeping the shell on the server
 * means the auth pages pay zero JS for the layout.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Header />

      <main className="relative grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-10 sm:px-6 sm:py-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_42%),radial-gradient(circle_at_bottom_right,color-mix(in_oklch,var(--accent)_16%,transparent),transparent_38%)]"
        />

        <div className="w-full min-w-0 max-w-md space-y-6">
          <Card className="min-w-0 shadow-xl shadow-primary/5">
            <CardContent className="flex min-w-0 justify-center py-2 sm:px-6 sm:py-4">
              {children}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Secure sign-in · Your session stays private
          </p>
        </div>
      </main>
    </div>
  );
}
