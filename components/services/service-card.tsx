/**
 * Purpose: Reusable service card for public catalog and admin overview screens.
 * Responsibilities: show service identity, pricing, duration, branch/category, and optional management metadata.
 * Important notes: this component stays presentational so server pages can pass API-shaped service data directly.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type ServiceCardProps = {
  actionLabel?: string;
  branch?: string;
  category?: string;
  description?: string | null;
  duration: string;
  href?: string;
  meta?: string;
  nameEn?: string;
  nameHi: string;
  price: string;
  status?: "active" | "inactive";
};

/**
 * Renders a compact card that works in dense admin lists and public catalog grids.
 */
export function ServiceCard({
  actionLabel = "Book now",
  branch,
  category,
  description,
  duration,
  href,
  meta,
  nameEn,
  nameHi,
  price,
  status,
}: ServiceCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden border-stone-200 bg-white">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {category ? <Badge className="w-fit">{category}</Badge> : null}
          {status ? (
            <Badge
              className="w-fit"
              variant={status === "active" ? "secondary" : "outline"}
            >
              {status === "active" ? "Active" : "Inactive"}
            </Badge>
          ) : null}
        </div>
        <div>
          <CardTitle className="font-heading text-lg">{nameHi}</CardTitle>
          {nameEn ? (
            <p className="mt-1 text-sm text-muted-foreground">{nameEn}</p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 text-sm text-muted-foreground">
        {description ? <p className="line-clamp-2">{description}</p> : null}
        <div className="grid gap-1">
          {branch ? <p>{branch}</p> : null}
          <p>{duration}</p>
          {meta ? <p>{meta}</p> : null}
        </div>
        <p className="text-base font-semibold text-foreground">{price}</p>
      </CardContent>
      <CardFooter>
        <Button asChild={Boolean(href)} className="w-full" variant="secondary">
          {href ? <a href={href}>{actionLabel}</a> : <span>{actionLabel}</span>}
        </Button>
      </CardFooter>
    </Card>
  );
}
