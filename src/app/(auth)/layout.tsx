/**
 * Auth route-group layout.
 *
 * Why a route group:
 * Auth pages (login, register, forgot) share a chrome — centered, no public
 * header/footer. Parentheses mean `(auth)` does not appear in the URL:
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
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      {children}
    </div>
  );
}
