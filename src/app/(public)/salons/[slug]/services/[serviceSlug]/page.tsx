import { ServicePublicationCard } from "@/features/service/service-publication-card";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowRight, Clock, Star } from "lucide-react";

import { CoverImage } from "@/components/shared/cover-image";
import { NavLink } from "@/components/shared/nav-link";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { getSession } from "@/lib/auth/get-session";
import { ReviewForm, ReviewList, ReviewSummary } from "@/features/review";
import type { PublicReview as WireReview } from "@/features/review";
import { SalonNotFoundError, SalonRoleInsufficientError } from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement, getSalonSummaryBySlug } from "@/server/modules/salon/salon.service";
import { ServiceNotFoundError } from "@/server/modules/service/service.errors";
import { getManagedSalonService, getSalonService } from "@/server/modules/service/service.service";
import { listReviewsForService } from "@/server/modules/review/review.service";
import type { PublicReview as ServerReview } from "@/server/modules/review/review.types";

interface PageProps {
  params: Promise<{ slug: string; serviceSlug: string }>;
}

/** Private previews retain the public URL without exposing drafts to other visitors. */
const getDetail = cache(async (salonSlug: string, serviceSlug: string) => {
  try {
    const [service, salon] = await Promise.all([
      getSalonService(salonSlug, serviceSlug),
      getSalonSummaryBySlug(salonSlug),
    ]);
    return { service, salon, preview: false };
  } catch (error) {
    if (!(error instanceof SalonNotFoundError) && !(error instanceof ServiceNotFoundError)) throw error;
    const user = await getSession();
    if (!user) throw error;
    const salon = await getSalonForServiceManagement(salonSlug, user.id);
    const service = await getManagedSalonService(user.id, salonSlug, serviceSlug, "slug");
    return { service, salon, preview: true };
  }
});
const priceFormatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  maximumFractionDigits: 2,
});

/** Builds search and sharing metadata from the public service contract. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, serviceSlug } = await params;

  try {
    const { service, preview } = await getDetail(slug, serviceSlug);
    if (preview) return { title: service.name, robots: { index: false, follow: false } };
    const description =
      service.shortDescription ??
      service.description?.slice(0, 160) ??
      `${service.name} salon service.`;

    return {
      title: service.name,
      description,
      openGraph: {
        title: service.name,
        description,
        images: (service.bannerImage ?? service.coverImage ?? service.images[0])
          ? [service.bannerImage ?? service.coverImage ?? service.images[0]]
          : undefined,
        type: "website",
      },
    };
  } catch {
    return { title: "Service not found" };
  }
}

/** Displays one active salon service and provides a direct booking action. */
export default async function SalonServiceDetailPage({ params }: PageProps) {
  const { slug, serviceSlug } = await params;

  let detail;
  try {
    detail = await getDetail(slug, serviceSlug);
  } catch (error) {
    if (error instanceof SalonNotFoundError || error instanceof ServiceNotFoundError || error instanceof SalonRoleInsufficientError) notFound();
    throw error;
  }
  const { service, salon, preview } = detail;

  const description = service.description ?? service.shortDescription;
  const user = await getSession();
  let canManage = false;
  if (user) {
    try {
      await getSalonForServiceManagement(slug, user.id);
      canManage = true;
    } catch (error) {
      if (!(error instanceof SalonNotFoundError) && !(error instanceof SalonRoleInsufficientError)) throw error;
    }
  }

  // Private previews cannot use public reviews; published review dates are serialized for client props.
  const reviews = preview ? null : await listReviewsForService(service.id, {
    limit: 20,
    sort: "recent",
  });
  const wireReviews: WireReview[] = (reviews?.items ?? []).map((review) => ({
    ...(review as ServerReview),
    createdAt: new Date(review.createdAt).toISOString(),
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {preview && canManage ? <ServicePublicationCard salonId={service.salonId} serviceId={service.id} status={service.status} salonIsLive={salon.status === "LIVE"} /> : null}
      {service.bannerImage ? (
        <div className="mb-6">
          <CoverImage src={service.bannerImage} alt={`${service.name} banner`} aspect="wide" priority />
        </div>
      ) : null}


      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)] lg:items-start">
        <section aria-labelledby="service-title" className="min-w-0">
          <CoverImage
            src={service.coverImage ?? service.images[0]}
            alt={service.name}
            priority
            emptyLabel="No service image"
          />

          {service.images.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {service.images.map((url, index) => (
                <CoverImage key={`${url}-${index}`} src={url} alt={`${service.name} image ${index + 1}`} aspect="square" />
              ))}
            </div>
          ) : null}

          {description ? (
            <div className="mt-8">
              <h2 className="font-heading text-xl font-semibold">
                About this service
              </h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
                {description}
              </p>
            </div>
          ) : null}

          {reviews ? (
          <div className="mt-10 space-y-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent-foreground" aria-hidden="true" />
              <h2 className="font-heading text-xl font-semibold">
                Reviews
              </h2>
            </div>

            <ReviewSummary summary={reviews.summary} />

            <ReviewList
              items={wireReviews}
              currentUserId={user?.id ?? null}
              targetType="service"
              targetId={service.id}
            />

            {user && !preview ? (
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
                      targetType: "service",
                      targetId: service.id,
                    }}
                  />
                </div>
              </section>
            ) : null}
          </div>
          ) : null}
        </section>

        <aside className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24">
          {service.category ? (
            <Badge variant="secondary">{service.category.name}</Badge>
          ) : null}

          <h1
            id="service-title"
            className="mt-3 font-heading text-3xl font-semibold tracking-tight"
          >
            {service.name}
          </h1>

          {service.shortDescription &&
          service.shortDescription !== description ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {service.shortDescription}
            </p>
          ) : null}

          <dl className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/60 p-4">
              <dt className="text-xs text-muted-foreground">Price</dt>
              <dd className="mt-1 font-heading text-xl font-semibold text-primary">
                {priceFormatter.format(service.price)}
              </dd>
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <dt className="text-xs text-muted-foreground">Duration</dt>
              <dd className="mt-1 flex items-center gap-1.5 font-semibold">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {service.duration} min
              </dd>
            </div>
          </dl>

          {!preview && salon.status === "LIVE" ? (
          <NavLink
            href={`${routes.salonBooking(slug)}?service=${encodeURIComponent(service.slug)}`}
            variant="default"
            size="lg"
            markActive={false}
            className="mt-6 w-full justify-center"
            iconRight={<ArrowRight className="h-4 w-4" />}
          >
            Book this service
          </NavLink>
          ) : <p className="mt-4 text-sm text-muted-foreground">Bookings are unavailable for this service.</p>}
          {canManage ? <NavLink href={routes.salonServiceEdit(slug, service.slug)} variant="outline" markActive={false} className="mt-3 w-full justify-center">Edit service</NavLink> : null}
        </aside>
      </div>
    </main>
  );
}
