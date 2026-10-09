import "server-only";

import { prisma } from "@/lib/prisma";

const PUBLIC_PACKAGE_SELECT = {
  id: true,
  salonId: true,
  name: true,
  slug: true,
  price: true,
  duration: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  services: {
    select: {
      serviceId: true,
      service: { select: { id: true, name: true, slug: true, price: true } },
    },
  },
} as const;

/** Cursor-paginated list of a salon's packages (active only unless told otherwise). */
export async function listSalonPackages(
  salonId: string,
  input: { cursor?: string; limit: number; includeInactive?: boolean },
) {
  const rows = await prisma.package.findMany({
    where: {
      salonId,
      deletedAt: null,
      ...(input.includeInactive ? {} : { isActive: true }),
    },
    select: PUBLIC_PACKAGE_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/** Loads an active, non-deleted package by slug within a salon. */
export async function findPackageBySlug(salonId: string, slug: string) {
  return prisma.package.findFirst({
    where: { salonId, slug, isActive: true, deletedAt: null },
    select: PUBLIC_PACKAGE_SELECT,
  });
}

/** Loads a package by id (management surface, includes inactive/soft-deleted). */
export async function findPackageById(id: string) {
  return prisma.package.findFirst({
    where: { id, deletedAt: null },
    select: PUBLIC_PACKAGE_SELECT,
  });
}

/** Returns true when the slug is already used by a live package in the salon. */
export async function packageSlugExists(salonId: string, slug: string) {
  const found = await prisma.package.findFirst({
    where: { salonId, slug, deletedAt: null },
    select: { id: true },
  });
  return found !== null;
}

/** Creates a package and links its services. */
export async function createPackage(data: {
  salonId: string;
  name: string;
  slug: string;
  price: number;
  duration: number;
  isActive: boolean;
  serviceIds: string[];
}) {
  return prisma.package.create({
    data: {
      salonId: data.salonId,
      name: data.name,
      slug: data.slug,
      price: data.price,
      duration: data.duration,
      isActive: data.isActive,
      services: {
        create: data.serviceIds.map((serviceId) => ({ serviceId })),
      },
    },
    select: PUBLIC_PACKAGE_SELECT,
  });
}

/** Applies a partial update; `serviceIds` replaces the linked set when given. */
export async function updatePackageById(
  id: string,
  data: {
    name?: string;
    price?: number;
    duration?: number;
    isActive?: boolean;
    serviceIds?: string[];
  },
) {
  const { serviceIds, ...fields } = data;

  return prisma.$transaction(async (transaction) => {
    if (serviceIds) {
      await transaction.packageService.deleteMany({ where: { packageId: id } });
      await transaction.packageService.createMany({
        data: serviceIds.map((serviceId) => ({ packageId: id, serviceId })),
      });
    }

    return transaction.package.update({
      where: { id },
      data: fields,
      select: PUBLIC_PACKAGE_SELECT,
    });
  });
}

/** Soft-deletes a package. */
export async function softDeletePackage(id: string) {
  return prisma.package.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
    select: PUBLIC_PACKAGE_SELECT,
  });
}
