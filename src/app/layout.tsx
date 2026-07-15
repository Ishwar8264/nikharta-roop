// Load the global Tailwind stylesheet once from the root layout.
import "./globals.css";

// Load the shared theme selector shown across application routes.
import { ThemeToggle } from "@/src/components/theme-toggle";
// Load the single global host for shared application notifications.
import { Toaster } from "@/src/components/ui/sonner";
// Load the existing theme provider to manage saved and system preferences.
import { ThemeProvider } from "next-themes";
// Load optimized Google fonts for brand headings, UI text, and Hindi content.
import {
  Manrope,
  Noto_Sans_Devanagari,
  Playfair_Display,
} from "next/font/google";
// Load the metadata type for a strict application identity declaration.
import type { Metadata } from "next";

// Configure Manrope as the variable UI font while loading only Latin glyphs.
const manrope = Manrope({
  // Swap promptly to avoid hiding content while the web font loads.
  display: "swap",
  // Load the Latin subset used by the main English interface.
  subsets: ["latin"],
  // Expose the optimized font through the shared Tailwind theme.
  variable: "--font-manrope",
});

// Configure Playfair Display as the editorial font for marketing headings.
const playfairDisplay = Playfair_Display({
  // Swap promptly so large headings remain visible during loading.
  display: "swap",
  // Load the Latin subset used by the English salon brand voice.
  subsets: ["latin"],
  // Expose the display face without forcing it onto application UI.
  variable: "--font-playfair",
});

// Configure a dedicated Devanagari face for readable Hindi content.
const notoSansDevanagari = Noto_Sans_Devanagari({
  // Swap promptly so Hindi content never waits on an invisible font.
  display: "swap",
  // Load only the Devanagari subset needed by Hindi content.
  subsets: ["devanagari"],
  // Expose the Hindi face as an opt-in design-system utility.
  variable: "--font-noto-devanagari",
});

// Define the public brand identity used by browsers and search previews.
export const metadata: Metadata = {
  // Describe the current salon experience in search and share previews.
  description: "A warm, modern salon experience designed around your style.",
  // Keep the application title aligned with the salon brand name.
  title: "Nikharta Roop Salon",
};

// Render the shared document shell for every App Router route.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Keep global antialiasing while rendering each route inside the document body.
  return (
    <html
      className={`${manrope.variable} ${playfairDisplay.variable} ${notoSansDevanagari.variable}`}
      lang="en"
      suppressHydrationWarning
    >
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
          {/* Render every props-driven toast inside the active theme provider. */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
