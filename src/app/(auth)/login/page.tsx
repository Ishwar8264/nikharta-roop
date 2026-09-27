import { LoginForm } from "@/features/auth/login/components/form";
import type { Metadata } from "next";
import { Suspense } from "react";
import { listOAuthProviders } from "@/server/auth/oauth/providers";
export const metadata: Metadata = {
  title: "Sign in · Nikharta Roop",
  description: "Sign in to your Nikharta Roop account.",
};

/**
 * Login page.
 *
 * Why Suspense:
 * `useSearchParams()` inside LoginForm forces the page out of static
 * pre-rendering unless wrapped in Suspense. Without this boundary Next.js
 * logs a build warning and defers the whole page to the client. Wrapping
 * lets the shell stay static while only the form defers.
 */
export default function LoginPage() {
  const providers = listOAuthProviders().filter(
    (provider) => provider.configured,
  );
  return (
    <Suspense fallback={null}>
      <LoginForm providers={providers} />
    </Suspense>
  );
}
