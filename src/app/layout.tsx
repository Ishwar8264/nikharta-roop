import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { siteConfig } from "@/config/site";
import { getSession } from "@/lib/auth/get-session";

import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/components/authProvider";
import { OnboardingReminder } from "@/features/onboarding/onboarding-reminder";
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
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Salon Booking in India`,
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Discover salons, compare services, and manage beauty appointments with Nikharta Roop.",
  applicationName: siteConfig.name,
  category: "beauty",
  keywords: [
    "salon booking",
    "beauty salon India",
    "book salon appointment",
    "salon services",
    "Nikharta Roop",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Salon Booking in India`,
    description:
      "Discover salons, compare services, and manage beauty appointments.",
    url: "/",
    images: [
      {
        url: "/brand/logo/nikharta-roop-light.jpg",
        alt: `${siteConfig.name} salon booking platform`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Salon Booking in India`,
    description:
      "Discover salons, compare services, and manage beauty appointments.",
    images: ["/brand/logo/nikharta-roop-light.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
    <html lang="en-IN" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${playfair.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider user={user}>
            <TooltipProvider>
              <OnboardingReminder />
              {children}
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
