import { Card, CardContent } from "@/components/ui/card";
import { listPublicBranches } from "@/features/branches/queries/branch.query";
import { CustomerProfileDetails } from "@/features/users/components/customer-profile-details";
import { getMyProfile } from "@/features/users/queries/user-profile.query";

export default async function CustomerProfilePage() {
  const [{ branches }, profile] = await Promise.all([
    listPublicBranches(),
    getMyProfile(),
  ]);
  const branch = branches.find((item) => item.id === profile.user?.branchId);

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5">
        <p className="text-sm font-medium text-rose-700">Profile</p>
        <h1 className="font-heading text-2xl font-semibold">
          Your account details
        </h1>
      </div>

      {profile.user ? (
        <CustomerProfileDetails branch={branch} user={profile.user} />
      ) : (
        <Card className="bg-white/80">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{profile.error}</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
