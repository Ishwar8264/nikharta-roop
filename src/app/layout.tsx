import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { getSession } from "@/lib/auth/get-session";

import { AuthProvider } from "@/features/auth/components/authProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nikharta Roop",
  description: "Premium salon booking platform",
};

/**
 * Root layout.
 *
 * Why it resolves the session:
 * The user object must come from the server (HttpOnly cookie). Fetching it
 * once here and providing it via AuthProvider gives every client island the
 * same authoritative user — no client-side /auth/me round trip, no flicker.
 *
 * getSession() is cache()'d, so the Header's own call is a no-op on the same
 * request — the DB is only hit once.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider user={user}>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
