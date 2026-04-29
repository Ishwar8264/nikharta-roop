import type { Metadata } from "next";
import Link from "next/link";
import "swagger-ui-dist/swagger-ui.css";

import { AuthSwaggerUi } from "@/components/auth/auth-swagger-ui";

export const metadata: Metadata = {
  title: "Nikharta Roop Auth API Docs",
  description: "Swagger UI for Nikharta Roop auth endpoints.",
};

const specUrl = "/api/docs/auth/openapi";

/**
 * Shows the browser-based Swagger UI for auth endpoints.
 */
export default function AuthDocsPage() {
  return (
    <main className="min-h-screen bg-[#fffaf6] px-4 py-8 text-stone-950 md:px-8 md:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-3xl border border-rose-100 bg-white/80 p-6 shadow-[0_24px_80px_-48px_rgba(136,14,79,0.35)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-700">
                Auth Swagger UI
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-stone-950 md:text-5xl">
                Nikharta Roop Auth API
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-stone-600 md:text-base">
                Register starts signup OTP for the mobile-first auth flow.
                Branch selection, avatar upload, OTP verification, and session
                login stay as separate steps.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href={specUrl}
                className="rounded-full bg-stone-950 px-4 py-2 font-medium text-white transition hover:bg-rose-900"
              >
                Open JSON Spec
              </Link>
              <Link
                href="/api/v1/auth/register"
                className="rounded-full border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition hover:border-rose-300 hover:text-stone-950"
              >
                Register Endpoint
              </Link>
            </div>
          </div>
        </section>

        <AuthSwaggerUi specUrl={specUrl} />
      </div>
    </main>
  );
}
