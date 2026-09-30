import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { getSession } from "@/lib/auth/get-session";
import { listManagedSalonProducts } from "@/server/modules/product/product.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cursor?: string }>;
}

/** Lists active and inactive products with cursor pagination for managers. */
export default async function ManageProductsPage({
  params,
  searchParams,
}: Props) {
  const [{ slug }, { cursor }] = await Promise.all([params, searchParams]);
  if (cursor && !isResourceId(cursor)) notFound();
  const user = await getSession();
  if (!user)
    redirect(
      `/login?redirect=${encodeURIComponent(routes.salonProductsManage(slug))}`,
    );
  let salon;
  let products;
  try {
    [salon, products] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      listManagedSalonProducts(user.id, slug, cursor),
    ]);
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError
    )
      notFound();
    throw error;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href={routes.salonProducts(slug)}
            className="text-sm text-primary underline"
          >
            Public catalogue
          </Link>
          <h1 className="mt-3 font-heading text-3xl font-semibold">
            Manage products
          </h1>
          <p className="mt-2 text-muted-foreground">{salon.name}</p>
        </div>
        <Button render={<Link href={routes.salonProductCreate(slug)} />}>
          Add product
        </Button>
      </header>
      {products.items.length ? (
        <ul className="divide-y rounded-xl border">
          {products.items.map((product) => (
            <li
              key={product.id}
              className="flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{product.name}</span>
                  <Badge variant="secondary">
                    {product.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Stock: {product.stock} ·{" "}
                  {product.category?.name ?? "Uncategorized"}
                </p>
              </div>
              <Button
                variant="outline"
                render={
                  <Link href={routes.salonProductEdit(slug, product.id)} />
                }
              >
                Edit
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border p-6 text-muted-foreground">
          No products yet.
        </p>
      )}
      {products.hasMore && products.nextCursor ? (
        <Link
          className="inline-block text-primary underline"
          href={`${routes.salonProductsManage(slug)}?cursor=${encodeURIComponent(products.nextCursor)}`}
        >
          More products
        </Link>
      ) : null}
    </main>
  );
}
