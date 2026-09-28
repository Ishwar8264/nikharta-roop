import { RegisterForm } from "@/features/auth/register/components/form";
import { routes } from "@/config/routes";
import { getSession } from "@/lib/auth/get-session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listOAuthProviders } from "@/server/auth/oauth/providers";

export const metadata: Metadata = {
  title: "Create account · Nikharta Roop",
  description: "Create your Nikharta Roop account to book salon services.",
};

/**
 * Register page.
 *
 * Why server:
 * It only renders a title, description, and one form. The form itself is a
 * client island. Keeping the page server means: metadata works, SSR HTML is
 * fast, and only the form's chunk ships to the browser.
 */
export default async function RegisterPage() {
  const user = await getSession();
  if (user) redirect(routes.dashboard);

  const providers = listOAuthProviders().filter(
    (provider) => provider.configured,
  );
  return <RegisterForm providers={providers} />;
}
