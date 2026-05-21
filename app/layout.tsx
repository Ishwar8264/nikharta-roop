/**
 * Purpose: Root application layout for all Nikharta Roop routes.
 * Responsibilities: configure global fonts, metadata, body styling, and the shared toaster.
 * Important notes: selection colors should maintain contrast on rose backgrounds.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nikharta Roop | Beauty Studio",
  description:
    "Nikharta Roop is a refined beauty studio for bridal, occasion, and everyday glow services.",
};

/**
 * Wraps every route in the global HTML/body shell and shared toast surface.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#fffaf6] text-stone-950 selection:bg-stone-900 selection:text-white">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
