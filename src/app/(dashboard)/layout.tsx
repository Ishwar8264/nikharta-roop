import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/get-session";

/**
 * Protected layout for all signed-in routes.
 *
 * Why protect here, not in proxy.ts:
 * proxy.ts already handles API authorization (CSRF, rate limits, JWT verify)
 * for /api/v1/*. Frontend routes need a redirect, not a JSON 401. Keeping
 * that decision in a layout means each route group owns its own policy
 * without bloating the proxy matcher.
 *
 * Why this catches every child:
 * In App Router, a layout wraps all nested pages. If the session is missing,
 * the redirect fires before any child renders — no child component can leak
 * data or execute queries under an anonymous request.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSession();
  if (!user) redirect("/login");

  return <>{children}</>;
}
