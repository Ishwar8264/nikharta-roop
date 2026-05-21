/**
 * Purpose: Legacy auth docs redirect route.
 * Responsibilities: expose metadata and send users to the consolidated API documentation page.
 * Important notes: this route intentionally has no UI because /docs/api owns the docs surface.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Auth API Docs | Nikharta Roop",
  description:
    "Redirects to the Nikharta Roop API documentation for authentication endpoints.",
};

/**
 * Redirects legacy auth documentation visits to the API docs route.
 */
export default function AuthDocsRedirectPage() {
  redirect("/docs/api");
}
