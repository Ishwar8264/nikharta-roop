import { PublicNavbar } from "@/features/navigation/components/public-navbar";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-[#fffaf6] text-stone-950">
      <PublicNavbar />
      {children}
    </main>
  );
}
