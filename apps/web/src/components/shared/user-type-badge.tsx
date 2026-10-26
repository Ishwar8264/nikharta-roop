"use client";

import { canAccessAdmin } from "@/lib/auth/permissions";
import { ShieldCheck, Store, UserRound, Users } from "lucide-react";
import type { SalonMemberRole } from "@nikharta-roop/shared/enums";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UserTypeBadgeProps {
  role: string;
  accountType?: "CUSTOMER" | "SALON_PARTNER" | null;
  salonRoles?: readonly SalonMemberRole[];
}

const membershipBadges = {
  OWNER: { label: "Owner", hint: "You own a salon. This role applies to that salon.", icon: Store },
  MANAGER: { label: "Manager", hint: "You manage a salon. This role applies to that salon.", icon: Users },
  STAFF: { label: "Staff", hint: "You are a salon team member. Access depends on your salon role.", icon: UserRound },
};

/** Show account identity without treating salon membership as a platform permission. */
export function UserTypeBadge({ role, accountType, salonRoles = [] }: UserTypeBadgeProps) {
  const badges = canAccessAdmin(role)
    ? [{ label: role === "SUPER_ADMIN" ? "Super admin" : role === "CONTENT_ADMIN" ? "Content admin" : "Admin", hint: "You have platform administration access.", icon: ShieldCheck }]
    : salonRoles.length
      ? [...new Set(salonRoles)].map((memberRole) => membershipBadges[memberRole])
      : accountType === "SALON_PARTNER"
        ? [{ label: "Salon partner", hint: "Your account is set up for salon partnership. Salon access requires membership.", icon: Store }]
        : [{ label: accountType === "CUSTOMER" ? "Customer" : "User", hint: "You can browse salons and book services.", icon: UserRound }];

  return (
    <span className="inline-flex flex-wrap gap-2">
      {badges.map(({ label, hint, icon: Icon }) => (
        <Tooltip key={label}>
          <TooltipTrigger render={<button type="button" className="inline-flex cursor-help rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring" />}>
            <Badge variant="secondary" className="gap-1.5">
              <Icon aria-hidden="true" /> {label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
      ))}
    </span>
  );
}
