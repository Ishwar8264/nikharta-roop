import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

/**
 * Layout for the public marketing surface.
 *
 * Why:
 * The header and footer are chrome specific to browseable pages — home,
 * salon directory, blog, and about. Auth pages and dashboards have their
 * own chrome, so they live in separate route groups and never inherit this
 * file.
 *
 * Route groups in parentheses do not appear in the URL: `(public)/salons`
 * still resolves to `/salons`.
 */
export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      <Footer />
    </>
  );
}
