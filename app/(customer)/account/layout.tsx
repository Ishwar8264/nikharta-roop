import Link from "next/link";
import { Bell, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/shared/logo/logo";
import { CustomerBottomNav } from "@/features/navigation/components/customer-bottom-nav";

export default function CustomerAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#fffaf6] pb-20 text-stone-950 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-rose-100 bg-[#fffaf6]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Logo size="sm" href="/account" />
          <div className="flex items-center gap-2">
            <Button asChild className="hidden bg-rose-900 text-white hover:bg-rose-800 sm:inline-flex">
              <Link href="/account/book">
                <Sparkles className="size-4" />
                Book
              </Link>
            </Button>
            <Button asChild aria-label="Notifications" size="icon" variant="outline">
              <Link href="/account/notifications">
                <Bell className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <CustomerBottomNav />
    </div>
  );
}
