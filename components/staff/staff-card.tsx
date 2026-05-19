/**
 * Purpose: Reusable staff card for public discovery and admin management screens.
 * Responsibilities: show staff identity, specialization, availability, services, and optional branch details.
 * Important notes: this component stays presentational so pages can pass API-shaped staff data directly.
 */
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type StaffCardProps = {
  branch?: string;
  experience?: string;
  isAvailable?: boolean;
  name: string;
  photoUrl?: null | string;
  services?: string[];
  specialization?: string;
  workHours?: string;
};

/**
 * Renders a compact staff summary card.
 */
export function StaffCard({
  branch,
  experience,
  isAvailable,
  name,
  photoUrl,
  services = [],
  specialization,
  workHours,
}: StaffCardProps) {
  const fallback = getAvatarFallback(name);

  return (
    <Card className="h-full bg-white">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage alt={name} src={photoUrl ?? undefined} />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{name}</p>
              {typeof isAvailable === "boolean" ? (
                <Badge variant={isAvailable ? "secondary" : "outline"}>
                  {isAvailable ? "Available" : "Unavailable"}
                </Badge>
              ) : null}
            </div>
            {specialization ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {specialization}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          {branch ? <p>{branch}</p> : null}
          {workHours ? <p>{workHours}</p> : null}
          {experience ? <p>{experience}</p> : null}
        </div>

        {services.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {services.slice(0, 4).map((service) => (
              <Badge key={service} variant="outline">
                {service}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * Builds a safe two-letter avatar fallback from a staff name.
 */
function getAvatarFallback(name: string) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "ST";
}
