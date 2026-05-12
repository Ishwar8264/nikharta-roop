import { CustomerHeader } from "@/features/navigation/components/customer-header";
import { CustomerBottomNav } from "@/features/navigation/components/customer-bottom-nav";

export default function CustomerAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#fffaf6] pb-20 text-stone-950 md:pb-0">
      <CustomerHeader />
      <main>{children}</main>
      <CustomerBottomNav />
    </div>
  );
}
