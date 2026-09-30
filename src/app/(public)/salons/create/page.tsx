import { SalonForm } from "@/features/salon/components/form";
import { getSession } from "@/lib/auth/get-session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create salon · Nikharta Roop",
  description: "Add a new salon to the Nikharta Roop platform.",
};

/**
 * Protected salon creation page.
 *
 * Why auth is checked here:
 * The URL lives beside the public salon directory, but creation is private.
 * Guarding the server page prevents the form from rendering for guests while
 * preserving the public salon layout and canonical `/salons/create` URL.
 */
export default async function NewSalonPage() {
  const user = await getSession();
  if (!user) redirect("/login?redirect=%2Fsalons%2Fcreate");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <SalonForm />
    </div>
  );
}
