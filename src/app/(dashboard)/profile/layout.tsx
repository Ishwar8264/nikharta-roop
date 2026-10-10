import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

/** Shared site header and footer for the profile overview and editor. */
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </div>
      <Footer />
    </div>
  );
}
