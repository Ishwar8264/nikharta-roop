import { listPublicBranches } from "@/features/branches/queries/branch.query";
import { AccountOverview } from "@/features/users/components/account-overview";
import { getMyProfile } from "@/features/users/queries/user-profile.query";

export default async function CustomerHomePage() {
  const [{ branches }, profile] = await Promise.all([
    listPublicBranches(),
    getMyProfile(),
  ]);

  if (!profile.user) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8 text-sm text-destructive">
        {profile.error ?? "Could not load account."}
      </section>
    );
  }

  return <AccountOverview branches={branches} user={profile.user} />;
}
