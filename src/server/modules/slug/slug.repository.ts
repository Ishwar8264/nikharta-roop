import "server-only";

import { prisma } from "@/lib/prisma";
import { postSlugExists, categorySlugExists as blogCategorySlugExists } from "@/server/modules/blog/blog.repository";
import { productSlugExistsInSalon, categorySlugExists as productCategorySlugExists } from "@/server/modules/product/product.repository";
import { salonSlugExists } from "@/server/modules/salon/salon.repository";
import { serviceSlugExistsInSalon, categorySlugExists as serviceCategorySlugExists } from "@/server/modules/service/service.repository";

import type { SlugAvailabilityQuery } from "./slug.schema";

/** Match database uniqueness, including inactive and soft-deleted records. */
export async function slugExists(input: SlugAvailabilityQuery): Promise<boolean> {
  const { resource, slug, salonId } = input;
  switch (resource) {
    case "salon": return salonSlugExists(slug);
    case "service":
      if (!salonId) throw new Error("Salon ID is required");
      return serviceSlugExistsInSalon(salonId, slug);
    case "product":
      if (!salonId) throw new Error("Salon ID is required");
      return productSlugExistsInSalon(salonId, slug);
    case "package":
      if (!salonId) throw new Error("Salon ID is required");
      // The existing package helper ignores deleted rows, which still occupy the unique key.
      return Boolean(await prisma.package.findUnique({ where: { salonId_slug: { salonId, slug } }, select: { id: true } }));
    case "service-category": return serviceCategorySlugExists(slug);
    case "product-category": return productCategorySlugExists(slug);
    case "blog-post": return postSlugExists(slug);
    case "blog-category": return blogCategorySlugExists(slug);
    case "blog-tag": return Boolean(await prisma.blogTag.findUnique({ where: { slug }, select: { id: true } }));
  }
}
