import { cache } from "react";
import { ProductPublicationCard } from "@/features/product/product-publication-card";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";

import { CoverImage } from "@/components/shared/cover-image";
import { NavLink } from "@/components/shared/nav-link";
import { RichTextContent } from "@/components/shared/rich-text-content";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { getSession } from "@/lib/auth/get-session";
import { ReviewForm, ReviewList, ReviewSummary } from "@/features/review";
import type { PublicReview as WireReview } from "@/features/review";
import { ProductNotFoundError } from "@/server/modules/product/product.errors";
import { getManagedSalonProduct, getSalonProduct } from "@/server/modules/product/product.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement, getSalonSummaryBySlug } from "@/server/modules/salon/salon.service";
import { listReviewsForProduct } from "@/server/modules/review/review.service";
import type { PublicReview as ServerReview } from "@/server/modules/review/review.types";

interface Props {
  params: Promise<{ slug: string; productSlug: string }>;
}
const priceFormatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  maximumFractionDigits: 2,
});

/** Private previews retain the public URL without exposing drafts to other visitors. */
const getDetail = cache(async (salonSlug: string, productSlug: string) => {
  try {
    const [product, salon] = await Promise.all([
      getSalonProduct(salonSlug, productSlug),
      getSalonSummaryBySlug(salonSlug),
    ]);
    return { product, salon, preview: false };
  } catch (error) {
    if (!(error instanceof SalonNotFoundError) && !(error instanceof ProductNotFoundError)) throw error;
    const user = await getSession();
    if (!user) throw error;
    const salon = await getSalonForServiceManagement(salonSlug, user.id);
    const product = await getManagedSalonProduct(user.id, salonSlug, productSlug, "slug");
    return { product, salon, preview: true };
  }
});
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, productSlug } = await params;
  try {
    const { product, preview } = await getDetail(slug, productSlug);
    if (preview) return { title: product.name, robots: { index: false, follow: false } };
    return { title: product.name, description: product.shortDescription ?? undefined };
  } catch {
    return { title: "Product not found" };
  }
}

/** Displays an active product and links managers to its edit form. */
export default async function ProductDetailPage({ params }: Props) {
  const { slug, productSlug } = await params;
  let detail;
  try {
    detail = await getDetail(slug, productSlug);
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof ProductNotFoundError ||
      error instanceof SalonRoleInsufficientError
    )
      notFound();
    throw error;
  }
  const { product, salon, preview } = detail;
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

  // Private previews cannot access public reviews.
  const reviews = preview ? null : await listReviewsForProduct(product.id, {
    limit: 20,
    sort: "recent",
  });
  const wireReviews: WireReview[] = (reviews?.items ?? []).map((review) => ({
    ...(review as ServerReview),
    createdAt: new Date(review.createdAt).toISOString(),
  }));

  return (
    <main className="min-w-0">
      {preview && canManage ? <ProductPublicationCard salonId={product.salonId} productId={product.id} status={product.status} salonIsLive={salon.status === "LIVE"} /> : null}
      {product.bannerImage ? (
        <div className="mb-6">
          <CoverImage src={product.bannerImage} alt={`${product.name} banner`} aspect="wide" priority />
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <CoverImage
            src={product.coverImage ?? product.images[0]}
            alt={product.name}
            priority
            emptyLabel="No product image"
          />
          {product.images.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {product.images.map((url, index) => (
                <CoverImage
                  key={`${url}-${index}`}
                  src={url}
                  alt={`${product.name} image ${index + 1}`}
                  aspect="square"
                />
              ))}
            </div>
          ) : null}

          {reviews ? (
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent-foreground" aria-hidden="true" />
              <h2 className="font-heading text-xl font-semibold">Reviews</h2>
            </div>

            <ReviewSummary summary={reviews.summary} />

            <ReviewList
              items={wireReviews}
              currentUserId={user?.id ?? null}
              targetType="product"
              targetId={product.id}
            />

            {user ? (
              <section
                aria-labelledby="review-form-title"
                className="rounded-xl border border-border bg-card p-4"
              >
                <h3
                  id="review-form-title"
                  className="font-heading text-base font-semibold"
                >
                  Share your experience
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Posting again replaces your previous review.
                </p>
                <div className="mt-4">
                  <ReviewForm
                    mode={{
                      kind: "create",
                      targetType: "product",
                      targetId: product.id,
                    }}
                  />
                </div>
              </section>
            ) : null}
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
              href={routes.salonProductEdit(slug, product.slug)}
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
