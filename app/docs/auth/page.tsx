import type { Metadata } from "next";
import Link from "next/link";
import "swagger-ui-dist/swagger-ui.css";

import { AuthSwaggerUi } from "@/components/auth/auth-swagger-ui";

export const metadata: Metadata = {
  title: "Nikharta Roop Auth API Docs",
  description: "Swagger UI for Nikharta Roop auth endpoints.",
};

const specUrl = "/api/docs/auth/openapi";

const endpointCards = [
  {
    method: "POST",
    path: "/api/v1/auth/register",
    purpose: "Start signup OTP. No user is created here.",
    x: 60,
    y: 130,
  },
  {
    method: "POST",
    path: "/api/v1/auth/register/verify",
    purpose: "Verify OTP, create user, create session.",
    x: 600,
    y: 130,
  },
  {
    method: "POST",
    path: "/api/v1/auth/login",
    purpose: "Start login OTP for an existing user.",
    x: 60,
    y: 280,
  },
  {
    method: "POST",
    path: "/api/v1/auth/login/verify",
    purpose: "Verify OTP and create login session.",
    x: 600,
    y: 280,
  },
  {
    method: "POST",
    path: "/api/v1/auth/refresh",
    purpose: "Rotate session and refresh tokens.",
    x: 60,
    y: 475,
  },
  {
    method: "GET",
    path: "/api/v1/auth/me",
    purpose: "Return authenticated user.",
    x: 415,
    y: 475,
  },
  {
    method: "POST",
    path: "/api/v1/auth/logout",
    purpose: "Revoke current session.",
    x: 770,
    y: 475,
  },
  {
    method: "GET",
    path: "/api/v1/auth/sessions",
    purpose: "List active device sessions.",
    x: 245,
    y: 610,
  },
  {
    method: "DELETE",
    path: "/api/v1/auth/sessions/{sessionId}",
    purpose: "Revoke one owned session.",
    x: 600,
    y: 610,
  },
];

const securityNotes = [
  "Tokens are stored hashed in PostgreSQL.",
  "Browser clients receive HttpOnly auth cookies.",
  "Bearer tokens remain supported for API/mobile clients.",
  "Session deviceName is derived from User-Agent.",
];

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
                Mobile-first OTP auth with signup, login, HttpOnly cookie
                sessions, bearer fallback, refresh rotation, logout, and
                multi-device session management.
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
                href="#auth-endpoints"
                className="rounded-full border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition hover:border-rose-300 hover:text-stone-950"
              >
                Endpoint Map
              </Link>
            </div>
          </div>
        </section>

        <section
          id="auth-endpoints"
          className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-[0_24px_80px_-48px_rgba(136,14,79,0.35)]"
        >
          <div className="border-b border-rose-100 px-6 py-5 md:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">
              Auth Endpoint SVG
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Simple endpoint map
            </h2>
          </div>
          <div className="overflow-x-auto bg-[#fffaf6] p-4">
            <svg
              width="1120"
              height="760"
              viewBox="0 0 1120 760"
              role="img"
              aria-label="Auth API endpoint map"
              className="min-w-[980px] rounded-2xl border border-rose-100 bg-white"
            >
              <rect width="1120" height="760" rx="18" fill="#fffaf6" />
              <text
                x="60"
                y="64"
                fill="#1c1917"
                fontSize="34"
                fontWeight="800"
              >
                Auth API Endpoint Map
              </text>
              <text x="60" y="94" fill="#57534e" fontSize="15">
                OTP-first auth with HttpOnly cookies, bearer fallback, refresh
                rotation, and session management.
              </text>
              <line
                x1="60"
                y1="118"
                x2="1060"
                y2="118"
                stroke="#d6d3d1"
                strokeWidth="2"
              />
              <text
                x="60"
                y="150"
                fill="#166534"
                fontSize="12"
                fontWeight="800"
              >
                PUBLIC OTP
              </text>
              <text
                x="60"
                y="458"
                fill="#166534"
                fontSize="12"
                fontWeight="800"
              >
                AUTHENTICATED SESSION
              </text>
              <line
                x1="60"
                y1="430"
                x2="1060"
                y2="430"
                stroke="#d6d3d1"
                strokeWidth="2"
              />

              {endpointCards.map((endpoint) => (
                <g key={`${endpoint.method}-${endpoint.path}`}>
                  <rect
                    x={endpoint.x}
                    y={endpoint.y}
                    width="305"
                    height="96"
                    rx="16"
                    fill={
                      endpoint.y < 430
                        ? "#ffffff"
                        : "#fff7ed"
                    }
                    stroke={
                      endpoint.y < 430
                        ? "#f1d2ca"
                        : "#fed7aa"
                    }
                    strokeWidth="2"
                  />
                  <text
                    x={endpoint.x + 24}
                    y={endpoint.y + 34}
                    fill="#be123c"
                    fontSize="13"
                    fontWeight="800"
                  >
                    {endpoint.method}
                  </text>
                  <text
                    x={endpoint.x + 24}
                    y={endpoint.y + 62}
                    fill="#1c1917"
                    fontSize="16"
                    fontWeight="700"
                  >
                    {endpoint.path}
                  </text>
                  <text
                    x={endpoint.x + 24}
                    y={endpoint.y + 84}
                    fill="#57534e"
                    fontSize="13"
                  >
                    {endpoint.purpose}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </section>

        <section className="rounded-3xl border border-rose-100 bg-white p-6 shadow-[0_24px_80px_-56px_rgba(136,14,79,0.35)]">
          <h2 className="text-xl font-semibold tracking-tight">
            Security summary
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {securityNotes.map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700"
              >
                {note}
              </div>
            ))}
          </div>
        </section>

        <AuthSwaggerUi specUrl={specUrl} />
      </div>
    </main>
  );
}
