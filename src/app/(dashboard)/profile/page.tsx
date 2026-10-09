import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/features/profile";
import type { CurrentUserWire } from "@/features/profile";
import { getSession } from "@/lib/auth/get-session";

export const metadata: Metadata = {
  title: "Profile | Nikharta Roop",
  description:
    "View and edit your Nikharta Roop profile — name, avatar, and bio.",
};

/**
 * Customer profile page.
 *
 * Why the page is server-side:
 * The page reads the current user from `getSession()` (cookie-backed) so the
 * initial render shows the same authoritative record the API would return.
 * The edit form is a client component because RHF + state for the avatar
 * picker need browser APIs; the server hands it a plain wire-shape prop.
 *
 * Why the read-only summary is rendered server-side:
 * Email and phone are not editable through this surface — the schema rejects
 * them. Showing them inline (instead of in the form) makes the "what you can
 * edit here" boundary obvious without an extra rule explanation.
 */
export default async function ProfilePage() {
  const user = await getSession();
  if (!user) return null; // layout already redirects to /login

  const wire: CurrentUserWire = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    bio: user.bio,
    lat: user.lat,
    lng: user.lng,
    role: user.role,
    isOnboarded: user.isOnboarded,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    loyaltyPoints: user.loyaltyPoints,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <p className="text-sm text-muted-foreground">Account</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold sm:text-4xl">
          Profile
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage how salons and other customers see you on Nikharta Roop.
        </p>
      </header>

      <div className="mt-8 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
            <CardDescription>
              Email and phone are verified through separate flows. Contact
              support to change them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">
                {user.email ?? "Not set"}
                {user.emailVerified ? (
                  <span className="ml-2 text-xs text-emerald-600">
                    Verified
                  </span>
                ) : null}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">
                {user.phone ?? "Not set"}
                {user.phoneVerified ? (
                  <span className="ml-2 text-xs text-emerald-600">
                    Verified
                  </span>
                ) : null}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">{user.role}</span>
            </div>
          </CardContent>
        </Card>

        <ProfileForm initial={wire} />
      </div>
    </main>
  );
}
