import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

export default async function LegacyCreateProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(routes.salonProductCreate(slug));
}
