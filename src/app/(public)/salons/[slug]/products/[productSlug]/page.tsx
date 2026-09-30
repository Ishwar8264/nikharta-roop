import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/shared/back-button";
import { CoverImage } from "@/components/shared/cover-image";
import { NavLink } from "@/components/shared/nav-link";
import { RichTextContent } from "@/components/shared/rich-text-content";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { getSession } from "@/lib/auth/get-session";
import { ProductNotFoundError } from "@/server/modules/product/product.errors";
import { getSalonProduct } from "@/server/modules/product/product.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";

interface Props {
  params: Promise<{ slug: string; productSlug: string }>;
}
const priceFormatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  maximumFractionDigits: 2,
});

export const metadata: Metadata = { title: "Salon product · Nikharta Roop" };

/** Displays an active product and links managers to its edit form. */
export default async function ProductDetailPage({ params }: Props) {
  const { slug, productSlug } = await params;
  let product;
  try {
    product = await getSalonProduct(slug, productSlug);
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof ProductNotFoundError
    )
      notFound();
    throw error;
  }
  const user = await getSession();
  let canManage = false;
  if (user) {
    try {
      await getSalonForServiceManagement(slug, user.id);
      canManage = true;
    } catch (error) {
      if (
        !(error instanceof SalonNotFoundError) &&
        !(error instanceof SalonRoleInsufficientError)
      )
        throw error;
    }
  }
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <BackButton href={routes.salonProducts(slug)} variant="secondary" />
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <CoverImage
            src={product.images[0]}
            alt={product.name}
            priority
            emptyLabel="No product image"
          />
          {product.images.length > 1 ? (
            <div className="grid grid-cols-3 gap-3">
              {product.images.slice(1).map((url, index) => (
                <CoverImage
                  key={`${url}-${index}`}
                  src={url}
                  alt={`${product.name} image ${index + 2}`}
                  aspect="square"
                />
              ))}
            </div>
          ) : null}
        </div>
        <article className="space-y-5">
          {product.category ? (
            <Badge variant="secondary">{product.category.name}</Badge>
          ) : null}
          <h1 className="font-heading text-3xl font-semibold">
            {product.name}
          </h1>
          <p className="text-2xl font-semibold text-primary">
            {priceFormatter.format(product.price)}
          </p>
          <p className="text-sm text-muted-foreground">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
          {product.shortDescription ? <p>{product.shortDescription}</p> : null}
          {product.description ||
          product.descriptionHtml ||
          product.descriptionJson ? (
            <RichTextContent
              text={product.description}
              html={product.descriptionHtml}
              json={product.descriptionJson}
            />
          ) : null}
          {canManage ? (
            <NavLink
              href={routes.salonProductEdit(slug, product.id)}
              variant="outline"
              markActive={false}
            >
              Edit product
            </NavLink>
          ) : null}
        </article>
      </div>
    </main>
  );
}
