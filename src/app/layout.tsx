import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";

import "./globals.css";

/**
 * Typography — the two-font system.
 *
 * Why:
 * Playfair Display is loaded with only the weights the headings actually use
 * (700 for H1, 600 for H2-H3). Requesting the full range would ship ~150KB of
 * unused font data on every first paint. Inter is a variable font so a single
 * file covers every weight the UI needs.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"], // ← only the two weights we use
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nikharta Roop",
  description: "Premium salon booking platform",
};

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
