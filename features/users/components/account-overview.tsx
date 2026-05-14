import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import { AccountBranchSummary } from "@/features/users/components/account-branch-summary";
import { AccountProfileSummary } from "@/features/users/components/account-profile-summary";
import type { UserProfile } from "@/features/users/types/user-profile.types";

type AccountOverviewProps = {
  branches: PublicBranch[];
  user: UserProfile;
};

// Account landing card fed by profile and branch APIs.
export function AccountOverview({ branches, user }: AccountOverviewProps) {
  const branch = branches.find((item) => item.id === user.branchId);
  const displayName = user.name?.trim() || "Your account";
  const initials = getInitials(displayName);

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-700">My account</p>
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            Welcome, {displayName}
          </h1>
        </div>
        <Button asChild className="w-fit bg-rose-900 text-white hover:bg-rose-800">
          <Link href="/account/book">
            <CalendarDays className="size-4" />
            Book appointment
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <AccountProfileSummary
          displayName={displayName}
          initials={initials}
          user={user}
        />
        <AccountBranchSummary branch={branch} />
      </div>
    </section>
  );
}

function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();

  return value.slice(0, 2).toUpperCase();
}
