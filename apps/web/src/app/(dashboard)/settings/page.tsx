import type { Metadata } from "next";
import { ChangePasswordForm, DeleteAccountDialog } from "@/features/settings";
import { getSession } from "@/lib/auth/get-session";

export const metadata: Metadata = {
  title: "Settings | Nikharta Roop",
  description:
    "Change your password, manage active sessions, and delete your account.",
};

/**
 * Account settings page.
 *
 * Why the page resolves sessions server-side:
 * The list is the source of truth — the client panel only mutates it via
 * `revokeSessionApi`. Loading the initial list here means the page paints
 * with the active sessions before any client JS hydrates, and lets the
 * server-side `listSessions` flag the cookie-backed session as `isCurrent`
 * by comparing the refresh-token hash.
 *
 * Why we read the refresh-token cookie directly:
 * `listSessions(userId, currentRefreshToken)` needs the raw refresh token so
 * it can hash it and match against the stored session row. Server Components
 * cannot read the request object — `cookies()` from `next/headers` is the
 * only path. The cookie is HttpOnly, so client JS never sees it; the value
 * never leaves the server.
 */
export default async function SettingsPage() {
  const user = await getSession();
  if (!user) return null; // layout already redirects to /login

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <p className="text-sm text-muted-foreground">Account</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold sm:text-4xl">
          Settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Keep your account secure — change your password, review active
          sessions, and manage your data.
        </p>
      </header>

      <div className="mt-8 space-y-6">
        <ChangePasswordForm />
        <DeleteAccountDialog />
      </div>
    </main>
  );
}
