"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserAvatarProps = {
  avatarUrl: string | null;
  displayName: string;
  initials: string;
  size?: "default" | "lg" | "sm";
};

// Shared account avatar with saved image and initials fallback.
export function UserAvatar({
  avatarUrl,
  displayName,
  initials,
  size,
}: UserAvatarProps) {
  return (
    <Avatar size={size}>
      {avatarUrl ? (
        <AvatarImage alt={`${displayName} avatar`} src={avatarUrl} />
      ) : null}
      <AvatarFallback className="bg-rose-100 text-rose-900">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
