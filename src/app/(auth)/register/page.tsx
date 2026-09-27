import { RegisterForm } from "@/features/auth/register/components/form";
import type { Metadata } from "next";

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
export default function RegisterPage() {
  return <RegisterForm />;
}
