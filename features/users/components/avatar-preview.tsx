import { UserRound } from "lucide-react";

type AvatarPreviewProps = {
  avatarUrl: string | null;
  name: string | null;
};

// Shows the saved avatar URL, falling back to initials when absent/broken.
export function AvatarPreview({ avatarUrl, name }: AvatarPreviewProps) {
  const initials = getInitials(name);

  return (
    <div className="flex items-center gap-4">
      <div className="grid size-20 place-items-center overflow-hidden rounded-full bg-rose-100 text-lg font-semibold text-rose-900 ring-1 ring-rose-200">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={name ? `${name} avatar` : "Profile avatar"}
            className="size-full object-cover"
            src={avatarUrl}
          />
        ) : (
          <span className="flex items-center gap-1">
            <UserRound className="size-5" />
            {initials}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-stone-950">
          {name || "Your profile photo"}
        </p>
        <p className="text-xs text-muted-foreground">
          Use a secure image URL from your storage provider.
        </p>
      </div>
    </div>
  );
}

function getInitials(value: string | null) {
  const words = value?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return value?.slice(0, 2).toUpperCase() || "NR";
}
