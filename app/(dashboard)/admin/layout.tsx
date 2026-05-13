import { redirect } from "next/navigation";

import { getSessionUserInfo } from "@/features/auth/helpers/session-user-info.server";
import { DashboardMobileHeader } from "@/features/navigation/components/dashboard-mobile-header";
import { DashboardSidebar } from "@/features/navigation/components/dashboard-sidebar";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionUserInfo();

  if (!session.user) {
    redirect("/signin");
  }

  if (!session.isAdmin) {
    redirect("/account");
  }

  return (
    <div className="min-h-screen bg-[#fffaf6] text-stone-950">
      <DashboardSidebar />
      <div className="lg:pl-72">
        <DashboardMobileHeader />
        <main>{children}</main>
      </div>
    </div>
  );
}
