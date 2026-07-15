// Render a centered and theme-aware shell around every authentication page.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Keep authentication content readable in light, dark, and system modes.
  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background p-4">
      {/* Use semantic colors so the authentication card follows the selected theme. */}
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-card-foreground shadow-md">
        {/* Render the active login or signup page inside the shared card. */}
        {children}
      </div>
    </div>
  );
}
