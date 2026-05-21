/**
 * Purpose: Reusable offer card for admin and public offer screens.
 * Responsibilities: show coupon identity, branch scope, discount, limits, validity, and service restrictions.
 * Important notes: branch can be null for global offers.
 */
import { DiscountType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OfferCardProps = {
  branch?: string | null;
  code: string;
  description?: null | string;
  discountType: DiscountType;
  discountValue: string;
  isActive?: boolean;
  minOrder?: null | string;
  services?: string[];
  titleEn?: null | string;
  titleHi: string;
  validUntil: Date | string;
};

const EMPTY_OFFER_SERVICES: string[] = [];
const INR_PRICE_FORMATTER = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
});
const OFFER_DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Renders a compact offer summary card.
 */
export function OfferCard({
  branch,
  code,
  description,
  discountType,
  discountValue,
  isActive,
  minOrder,
  services = EMPTY_OFFER_SERVICES,
  titleEn,
  titleHi,
  validUntil,
}: OfferCardProps) {
  return (
    <Card className="h-full bg-white">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{code}</Badge>
          {typeof isActive === "boolean" ? (
            <Badge variant={isActive ? "secondary" : "outline"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          ) : null}
          <Badge variant="outline">{branch ?? "All branches"}</Badge>
        </div>
        <div>
          <CardTitle className="font-heading text-lg">{titleHi}</CardTitle>
          {titleEn ? <p className="mt-1 text-sm text-muted-foreground">{titleEn}</p> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {description ? <p className="line-clamp-2">{description}</p> : null}
        <p className="text-base font-semibold text-foreground">
          {formatDiscount(discountType, discountValue)} off
        </p>
        <div className="flex flex-wrap gap-2">
          {services.slice(0, 4).map((service) => (
            <Badge key={service} variant="outline">
              {service}
            </Badge>
          ))}
        </div>
        <div className="space-y-1">
          {minOrder ? <p>Minimum order {formatPrice(minOrder)}</p> : null}
          <p>Valid until {formatDate(validUntil)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Formats discount based on the offer type.
 */
function formatDiscount(type: DiscountType, value: string) {
  if (type === DiscountType.PERCENTAGE) {
    return `${Number(value).toFixed(0)}%`;
  }

  return formatPrice(value);
}

/**
 * Formats API decimal strings as Indian rupee values.
 */
function formatPrice(price: string) {
  return INR_PRICE_FORMATTER.format(Number(price));
}

/**
 * Formats date-like API values for compact card text.
 */
function formatDate(value: Date | string) {
  return OFFER_DATE_FORMATTER.format(new Date(value));
}
