import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";

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
 * Why:
 * The root layout only owns things that every page needs: fonts, theme
 * provider, and the <html>/<body> shell. Chrome like the header and footer
 * lives in the route group that actually uses it (see `(public)/layout.tsx`)
 * so auth pages and dashboards do not inherit a marketing header.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
