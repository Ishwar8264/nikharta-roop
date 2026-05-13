import { redirect } from "next/navigation";

import { getCurrentUserFromRequest } from "@/features/auth/helpers/auth-session.server";
import { CustomerHeader } from "@/features/navigation/components/customer-header";
import { CustomerBottomNav } from "@/features/navigation/components/customer-bottom-nav";

export default async function CustomerAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUserFromRequest();

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-[#fffaf6] pb-20 text-stone-950 md:pb-0">
      <CustomerHeader user={user} />
      <main>{children}</main>
      <CustomerBottomNav />
    </div>
  );
}
