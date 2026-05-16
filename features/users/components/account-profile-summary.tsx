import Link from "next/link";
import type * as React from "react";
import { Mail, Phone, ShieldCheck } from "lucide-react";

import { UserAvatar } from "@/components/auth/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { UserProfile } from "@/features/users/types/user-profile.types";

type AccountProfileSummaryProps = {
  displayName: string;
  initials: string;
  user: UserProfile;
};

// Compact identity card for the customer account landing page.
export function AccountProfileSummary({
  displayName,
  initials,
  user,
}: AccountProfileSummaryProps) {
  return (
    <Card className="bg-white/85">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start gap-4">
          <UserAvatar avatarUrl={user.avatarUrl} displayName={displayName} initials={initials} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-stone-950">
              {displayName}
            </p>
            <p className="truncate text-sm text-muted-foreground">{user.mobile}</p>
          </div>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-800">
            {user.role}
          </span>
        </div>

        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <InfoRow icon={Phone} label={user.mobile} />
          <InfoRow icon={Mail} label={user.email || "Email not added"} />
          <InfoRow icon={ShieldCheck} label="Mobile verified" />
        </div>

        <Button asChild variant="outline">
          <Link href="/account/profile/edit">Edit profile</Link>
        </Button>
      </CardContent>
    </Card>
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
    <p className="flex min-w-0 items-center gap-2 rounded-lg bg-stone-50 px-3 py-2">
      <Icon className="size-4 shrink-0 text-stone-500" />
      <span className="truncate">{label}</span>
    </p>
  );
}
