import type { Metadata } from "next";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AdminNavigation } from "@/features/admin/admin-navigation";
import { getSession } from "@/lib/auth/get-session";

export const metadata: Metadata = {
  title: "Admin | Nikharta Roop",
  robots: { index: false, follow: false },
};

/** Gate all admin pages on the server before rendering shared site chrome and navigation. */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSession();
  if (!user || !canAccessAdmin(user.role)) notFound();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />
      <div className="min-h-[calc(100dvh-4rem-1px)] flex-1">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-[15rem_minmax(0,1fr)] lg:grid-cols-[17rem_minmax(0,1fr)]">
          <AdminNavigation role={user.role} />
          <main className="min-w-0">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
