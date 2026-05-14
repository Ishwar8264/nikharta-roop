import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listPublicBranches } from "@/features/branches/queries/branch.query";
import { AvatarForm } from "@/features/users/components/avatar-form";
import { ProfileForm } from "@/features/users/components/profile-form";
import { getMyProfile } from "@/features/users/queries/user-profile.query";

export default async function CustomerProfilePage() {
  const [{ branches }, profile] = await Promise.all([
    listPublicBranches(),
    getMyProfile(),
  ]);

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5">
        <p className="text-sm font-medium text-rose-700">Profile</p>
        <h1 className="font-heading text-2xl font-semibold">
          Manage your account details
        </h1>
      </div>

      {profile.user ? (
        <div className="space-y-4">
          <Card className="bg-white/80">
            <CardHeader>
              <CardTitle>Profile photo</CardTitle>
            </CardHeader>
            <CardContent>
              <AvatarForm user={profile.user} />
            </CardContent>
          </Card>

          <Card className="bg-white/80">
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm branches={branches} user={profile.user} />
            </CardContent>
          </Card>
        </div>
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
