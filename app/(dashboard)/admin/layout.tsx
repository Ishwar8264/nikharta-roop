import { DashboardMobileHeader } from "@/features/navigation/components/dashboard-mobile-header";
import { DashboardSidebar } from "@/features/navigation/components/dashboard-sidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
