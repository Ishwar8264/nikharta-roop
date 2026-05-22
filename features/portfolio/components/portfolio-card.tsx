/**
 * Purpose: Reusable portfolio card for admin and public gallery screens.
 * Responsibilities: show gallery image, title, branch, publish/featured status, and optional description.
 * Important notes: before/after images are supported but gallery image falls back to before/after when needed.
 */
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type PortfolioCardProps = {
  branch?: string;
  description?: null | string;
  imageUrls: string[];
  isFeatured?: boolean;
  isPublished?: boolean;
  meta?: string;
  title?: null | string;
};

/**
 * Renders a portfolio gallery card.
 */
export function PortfolioCard({
  branch,
  description,
  imageUrls,
  isFeatured,
  isPublished,
  meta,
  title,
}: PortfolioCardProps) {
  const imageUrl = imageUrls[0];

  return (
    <Card className="h-full overflow-hidden bg-white">
      {imageUrl ? (
        <Image
          alt={title ?? "Portfolio work"}
          className="h-56 w-full object-cover"
          height={224}
          src={imageUrl}
          width={448}
        />
      ) : (
        <div className="flex h-56 items-center justify-center bg-muted text-sm text-muted-foreground">
          No image
        </div>
      )}
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          {typeof isPublished === "boolean" ? (
            <Badge variant={isPublished ? "secondary" : "outline"}>
              {isPublished ? "Published" : "Draft"}
            </Badge>
          ) : null}
          {isFeatured ? <Badge>Featured</Badge> : null}
          {branch ? <Badge variant="outline">{branch}</Badge> : null}
        </div>
        {title ? <h2 className="font-heading text-lg font-semibold">{title}</h2> : null}
        {meta ? <p className="text-xs font-medium text-rose-700">{meta}</p> : null}
        {description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
