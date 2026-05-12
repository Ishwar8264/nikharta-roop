import { redirect } from "next/navigation";

import { getCurrentUserFromRequest } from "@/features/auth/helpers/auth-session.server";
import { DashboardMobileHeader } from "@/features/navigation/components/dashboard-mobile-header";
import { DashboardSidebar } from "@/features/navigation/components/dashboard-sidebar";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUserFromRequest();

  if (!user) {
    redirect("/signin");
  }

  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role ?? "")) {
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
