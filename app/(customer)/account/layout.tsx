import { redirect } from "next/navigation";

import { getSessionUserInfo } from "@/features/auth/helpers/session-user-info.server";
import { CustomerHeader } from "@/features/navigation/components/customer-header";
import { CustomerBottomNav } from "@/features/navigation/components/customer-bottom-nav";

export default async function CustomerAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionUserInfo();

  if (!session.user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-[#fffaf6] pb-20 text-stone-950 md:pb-0">
      <CustomerHeader session={session} />
      <main>{children}</main>
      <CustomerBottomNav />
    </div>
  );
}
