import { getSession } from "@/lib/auth/get-session";

/**
 * Minimal dashboard landing page.
 *
 * Why a stub:
 * Login must have somewhere real to land. A proper dashboard (stats,
 * upcoming appointments) is its own feature; this page exists to prove the
 * protected-route pipeline works end to end.
 */
export default async function DashboardPage() {
  const user = await getSession();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
      </h1>
      <p className="mt-2 text-muted-foreground">
        Your dashboard will appear here.
      </p>
    </main>
  );
}
