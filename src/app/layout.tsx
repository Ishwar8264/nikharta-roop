// Load the global Tailwind stylesheet once from the root layout.
import "./globals.css";

// Load the shared theme selector shown across application routes.
import { ThemeToggle } from "@/src/components/theme-toggle";
// Load the existing theme provider to manage saved and system preferences.
import { ThemeProvider } from "next-themes";

// Render the shared document shell for every App Router route.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Keep global antialiasing while rendering each route inside the document body.
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        {/* Apply the selected theme before rendering shared application content. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          {/* Keep theme selection available from every application route. */}
          <ThemeToggle />
          {/* Render the active App Router route inside the theme context. */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
