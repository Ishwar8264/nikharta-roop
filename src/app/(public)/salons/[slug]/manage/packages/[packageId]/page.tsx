import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

export default async function LegacyPackageEdit({ params }: { params: Promise<{ slug: string; packageId: string }> }) {
  const { slug, packageId } = await params;
  redirect(routes.salonPackageEdit(slug, packageId));
}
