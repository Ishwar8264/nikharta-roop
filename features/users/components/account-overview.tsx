import Link from "next/link";
import type * as React from "react";
import { MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import type { UserProfile } from "@/features/users/types/user-profile.types";

type AccountOverviewProps = {
  branches: PublicBranch[];
  user: UserProfile;
};

// Compact account home fed by the authenticated profile API.
export function AccountOverview({ branches, user }: AccountOverviewProps) {
  const branch = branches.find((item) => item.id === user.branchId);

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5">
        <p className="text-sm font-medium text-rose-700">My account</p>
        <h1 className="font-heading text-2xl font-semibold">
          Welcome, {user.name || "beautiful"}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-4" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <InfoRow icon={Phone} label={user.mobile} />
            <InfoRow icon={ShieldCheck} label={`Role: ${user.role}`} />
            <p>{user.email || "Email not added yet"}</p>
            <Button asChild className="mt-2 bg-rose-900 text-white hover:bg-rose-800">
              <Link href="/account/profile">Edit profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4" />
              Preferred branch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-stone-950">
              {branch?.nameHi ?? "No branch selected"}
            </p>
            <p>{branch?.address ?? "Choose a branch from your profile."}</p>
            <Button asChild variant="outline">
              <Link href="/branches">View branches</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <p className="flex items-center gap-2">
      <Icon className="size-4" />
      {label}
    </p>
  );
}
