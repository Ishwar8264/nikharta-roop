/**
 * Purpose: Reusable package card for admin and public package catalog screens.
 * Responsibilities: show package identity, branch, pricing, duration, services, and optional status.
 * Important notes: package service lists may be absent on public list responses, so services are optional.
 */
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PackageCardProps = {
  branch?: string;
  description?: null | string;
  duration?: null | string;
  imageUrl?: null | string;
  isActive?: boolean;
  nameEn?: null | string;
  nameHi: string;
  price: string;
  services?: string[];
};

/**
 * Renders a compact package summary card.
 */
export function PackageCard({
  branch,
  description,
  duration,
  imageUrl,
  isActive,
  nameEn,
  nameHi,
  price,
  services = [],
}: PackageCardProps) {
  return (
    <Card className="h-full overflow-hidden bg-white">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={nameHi} className="h-40 w-full object-cover" src={imageUrl} />
      ) : null}
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {typeof isActive === "boolean" ? (
            <Badge variant={isActive ? "secondary" : "outline"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          ) : null}
          {branch ? <Badge variant="outline">{branch}</Badge> : null}
        </div>
        <div>
          <CardTitle className="font-heading text-lg">{nameHi}</CardTitle>
          {nameEn ? <p className="mt-1 text-sm text-muted-foreground">{nameEn}</p> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {description ? <p className="line-clamp-2">{description}</p> : null}
        <div className="flex flex-wrap gap-2">
          {services.slice(0, 4).map((service) => (
            <Badge key={service} variant="outline">
              {service}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 text-foreground">
          <p className="font-semibold">{price}</p>
          {duration ? <p className="text-sm">{duration}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
