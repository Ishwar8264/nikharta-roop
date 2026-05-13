import { getSessionUserInfo } from "@/features/auth/helpers/session-user-info.server";
import { PublicNavbar } from "@/features/navigation/components/public-navbar";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionUserInfo();

  return (
    <main className="min-h-screen bg-[#fffaf6] text-stone-950">
      <PublicNavbar session={session} />
      {children}
    </main>
  );
}
