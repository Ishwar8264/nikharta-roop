import { getCurrentUserFromRequest } from "@/features/auth/helpers/auth-session.server";
import { PublicNavbar } from "@/features/navigation/components/public-navbar";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUserFromRequest();

  return (
    <main className="min-h-screen bg-[#fffaf6] text-stone-950">
      <PublicNavbar user={user} />
      {children}
    </main>
  );
}
