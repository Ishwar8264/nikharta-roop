import type { ComponentProps, ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface UserBadgeProps extends Omit<ComponentProps<"div">, "children"> {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  /** Avatar-only is useful inside an existing link or menu trigger. */
  showName?: boolean;
  description?: ReactNode;
  label?: ReactNode;
  labelClassName?: string;
  contentClassName?: string;
  size?: ComponentProps<typeof Avatar>["size"];
  nameAs?: "span" | "h1" | "h2" | "h3";
  fallbackName?: string;
  avatarAlt?: string;
  avatarClassName?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  nameClassName?: string;
  descriptionClassName?: string;
}

/** Displays user identity without owning navigation, authentication, or form state. */
export function UserBadge({
  name,
  email,
  avatar,
  showName = true,
  description,
  label,
  labelClassName,
  contentClassName,
  size = "default",
  nameAs: Name = "span",
  fallbackName = "Your account",
  avatarAlt,
  avatarClassName,
  imageClassName,
  fallbackClassName,
  nameClassName,
  descriptionClassName,
  className,
  ...props
}: UserBadgeProps) {
  const displayName = name?.trim() || fallbackName;
  const parts = (name?.trim() || email?.split("@")[0] || "?").split(/\s+/);
  const initials = (parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : "")).toUpperCase();

  return (
    <div {...props} className={cn("inline-flex min-w-0 items-center gap-3", className)}>
      <Avatar size={size} className={avatarClassName}>
        {avatar ? <AvatarImage src={avatar} alt={avatarAlt ?? (showName ? "" : `${displayName} profile photo`)} className={imageClassName} /> : null}
        <AvatarFallback className={cn("bg-primary/10 font-semibold text-primary", fallbackClassName)}>
          {initials}
        </AvatarFallback>
      </Avatar>
      {showName ? (
        <div className={cn("min-w-0 flex-1", contentClassName)}>
          {label != null ? <div className={cn("mb-2 text-xs font-medium text-muted-foreground", labelClassName)}>{label}</div> : null}
          <Name className={cn("block break-words text-sm font-medium", nameClassName)}>{displayName}</Name>
          {description != null ? <div className={cn("mt-1 text-xs text-muted-foreground", descriptionClassName)}>{description}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
