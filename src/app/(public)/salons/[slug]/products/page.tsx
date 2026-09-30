import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/shared/back-button";
import { NavLink } from "@/components/shared/nav-link";
import { routes } from "@/config/routes";
import { ProductCard } from "@/features/product/product-card";
import { getSession } from "@/lib/auth/get-session";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import {
  getSalonForServiceManagement,
  getSalonSummaryBySlug,
} from "@/server/modules/salon/salon.service";
import { listSalonProducts } from "@/server/modules/product/product.service";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cursor?: string }>;
}

export const metadata: Metadata = { title: "Salon products · Nikharta Roop" };

/** Displays the public, cursor-paginated product catalogue. */
export default async function SalonProductsPage({
  params,
  searchParams,
}: Props) {
  const [{ slug }, { cursor }] = await Promise.all([params, searchParams]);
  if (cursor && !isResourceId(cursor)) notFound();
  let salon;
  let products;
  let user;
  try {
    [salon, products, user] = await Promise.all([
      getSalonSummaryBySlug(slug),
      listSalonProducts(slug, {
        cursor,
        limit: 24,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
      getSession(),
    ]);
  } catch (error) {
    if (error instanceof SalonNotFoundError) notFound();
    throw error;
  }

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
      <BackButton href={routes.salonDetail(slug)} variant="secondary" />
      <header className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-primary">{salon.name}</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold">Products</h1>
          <p className="mt-2 text-muted-foreground">
            Explore products available at this salon.
          </p>
        </div>
        {canManage ? (
          <div className="flex gap-2">
            <NavLink
              href={routes.salonProductsManage(slug)}
              variant="outline"
              markActive={false}
            >
              Manage products
            </NavLink>
            <NavLink
              href={routes.salonProductCreate(slug)}
              variant="default"
              markActive={false}
            >
              Add product
            </NavLink>
          </div>
        ) : null}
      </header>
      {user?.role === "SUPER_ADMIN" ? (
        <NavLink
          href={routes.productCategoriesManage}
          markActive={false}
          className="mt-4 inline-flex text-sm text-primary"
        >
          Manage global categories
        </NavLink>
      ) : null}
      {products.items.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.items.map((product) => (
            <ProductCard key={product.id} salonSlug={slug} product={product} />
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-xl border p-8 text-center text-muted-foreground">
          No products available yet.
        </p>
      )}
      {products.hasMore && products.nextCursor ? (
        <NavLink
          href={`${routes.salonProducts(slug)}?cursor=${encodeURIComponent(products.nextCursor)}`}
          variant="outline"
          markActive={false}
          className="mt-8 inline-flex"
        >
          More products
        </NavLink>
      ) : null}
    </main>
  );
}
