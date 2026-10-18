import { CoverImage } from "@/components/shared/cover-image";
import { NavLink } from "@/components/shared/nav-link";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import type { PublicProduct } from "@/server/modules/product/product.types";

const priceFormatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  maximumFractionDigits: 2,
});

interface Props {
  salonSlug: string;
  product: PublicProduct;
}

/** Shows a product summary using the shared cover and navigation components. */
export function ProductCard({ salonSlug, product }: Props) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <CoverImage
        src={product.coverImage ?? product.images[0]}
        alt={product.name}
        aspect="video"
        rounded="none"
        emptyLabel="No product image"
        sizes="(max-width: 640px) 100vw, 33vw"
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        {product.category ? (
          <Badge variant="secondary" className="w-fit">
            {product.category.name}
          </Badge>
        ) : null}
        <h2 className="font-heading text-lg font-semibold">{product.name}</h2>
        <p className="font-semibold text-primary">
          {priceFormatter.format(product.price)}
        </p>
        {product.shortDescription ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {product.shortDescription}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>
          <NavLink
            href={routes.salonProductDetail(salonSlug, product.slug)}
            variant="outline"
            size="sm"
            markActive={false}
          >
            Details
          </NavLink>
        </div>
      </div>
    </article>
  );
}
