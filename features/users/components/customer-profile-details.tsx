import Link from "next/link";
import type * as React from "react";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

import { UserAvatar } from "@/components/auth/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import type { UserProfile } from "@/features/users/types/user-profile.types";

type CustomerProfileDetailsProps = {
  branch?: PublicBranch;
  user: UserProfile;
};

// Read-only profile view keeps /account/profile useful before editing.
export function CustomerProfileDetails({
  branch,
  user,
}: CustomerProfileDetailsProps) {
  return (
    <Card className="bg-white/85">
      <CardContent className="space-y-6 p-5">
        <ProfileHeader user={user} />
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <DetailRow icon={Phone} label="Mobile" value={user.mobile} />
          <DetailRow
            icon={Mail}
            label="Email"
            value={user.email ?? "Email not added"}
          />
          <DetailRow
            icon={MapPin}
            label="Preferred branch"
            value={branch ? `${branch.nameHi}, ${branch.city}` : "No branch selected"}
          />
          <DetailRow
            icon={ShieldCheck}
            label="Verification"
            value={user.mobileVerifiedAt ? "Mobile verified" : "Pending"}
          />
        </div>
        <Button asChild className="w-full bg-rose-900 text-white hover:bg-rose-800">
          <Link href="/account/profile/edit">Edit profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ProfileHeader({ user }: { user: UserProfile }) {
  const displayName = user.name || "Nikharta Roop customer";
  const initials = getInitials(displayName);

  return (
    <div className="flex items-start gap-4">
      <UserAvatar
        avatarUrl={user.avatarUrl}
        displayName={displayName}
        initials={initials}
        size="lg"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xl font-semibold text-stone-950">{displayName}</p>
        <p className="text-sm text-muted-foreground">{user.role}</p>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-xl bg-stone-50 p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-rose-800" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium text-stone-950">{value}</p>
      </div>
    </div>
  );
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
