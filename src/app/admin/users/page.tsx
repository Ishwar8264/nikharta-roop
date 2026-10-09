import type { Metadata } from "next";

import { UsersManager } from "@/features/admin";
import type { AdminUserView } from "@/features/admin";
import { getSession } from "@/lib/auth/get-session";
import { listAdminUsers } from "@/server/modules/admin/admin.service";

export const metadata: Metadata = {
  title: "Users | Admin",
  description: "Platform user management — role, AI quota, and AI block controls.",
  robots: { index: false, follow: false },
};

/**
 * Admin user management page.
 *
 * Why defense-in-depth here:
 * The admin layout already gates SUPER_ADMIN, but re-asserting the role in the
 * page mirrors the verification queue page and keeps this route safe if it is
 * ever re-parented. The service also re-checks on every call, so a leaked URL
 * cannot be exploited without the role.
 */
export default async function AdminUsersPage() {
  const user = await getSession();
  if (!user || user.role !== "SUPER_ADMIN") {
    // The layout already calls notFound(), but TS doesn't know that — narrow
    // the type so the service call below gets a concrete string.
    return null;
  }

  const result = await listAdminUsers(user.role, { limit: 100 });

  // Server-side `AdminUserView` carries `Date` fields; the client mirror types
  // them as ISO strings. Convert at the RSC boundary so types align.
  const users: AdminUserView[] = result.items.map((u) => ({
    ...u,
    deletedAt: u.deletedAt ? u.deletedAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold">Users</h1>
        <p className="mt-2 text-muted-foreground">
          {users.length === 0
            ? "No users to show."
            : `${users.length} user${users.length === 1 ? "" : "s"} on the platform.`}
        </p>
      </header>

      <UsersManager users={users} />
    </div>
  );
}
