import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { ServiceCategoryManager } from "@/features/service/category-manager";
import { getSession } from "@/lib/auth/get-session";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import { listServiceCategories } from "@/server/modules/service/service.service";

interface Props { searchParams: Promise<{ cursor?: string }> }

/** Lists global categories and gates creation to SUPER_ADMIN. */
export default async function ManageServiceCategoriesPage({ searchParams }: Props) {
  const user = await getSession();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(routes.serviceCategoriesManage)}`);
  if (user.role !== "SUPER_ADMIN") notFound();

  const { cursor } = await searchParams;
  if (cursor && !isResourceId(cursor)) notFound();
  const categories = await listServiceCategories({ cursor, limit: 50 });

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <header><Link href={routes.salons} className="text-sm text-primary underline">Salons</Link><h1 className="mt-3 font-heading text-3xl font-semibold">Service categories</h1></header>
      <ServiceCategoryManager />
      <section aria-labelledby="categories-title"><h2 id="categories-title" className="mb-4 text-xl font-semibold">Categories</h2>
        {categories.items.length === 0 ? <p className="text-muted-foreground">No categories yet.</p> : (
          <ul className="divide-y rounded-xl border">{categories.items.map((category) => <li key={category.id} className="flex justify-between gap-4 p-4"><span>{category.name}</span><span className="text-sm text-muted-foreground">{category.slug}</span></li>)}</ul>
        )}
        {categories.hasMore && categories.nextCursor ? <Link className="mt-5 inline-block text-primary underline" href={`${routes.serviceCategoriesManage}?cursor=${encodeURIComponent(categories.nextCursor)}`}>More categories</Link> : null}
      </section>
    </main>
  );
}
