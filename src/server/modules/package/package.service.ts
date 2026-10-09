import "server-only";

import { assertRoleAtLeast } from "@/server/modules/salon/salon.authorization";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { findSalonForViewer } from "@/server/modules/salon/salon.repository";
import { resolveSalonId } from "@/server/modules/service/service.repository";

import {
  PackageNotFoundError,
  PackageServiceMismatchError,
  PackageSlugConflictError,
} from "./package.errors";
import {
  createPackage,
  findPackageById,
  findPackageBySlug,
  listSalonPackages,
  packageSlugExists,
  softDeletePackage,
  updatePackageById,
} from "./package.repository";
import type {
  CreatePackageInput,
  ListPackagesQuery,
  PaginatedPackages,
  PublicPackage,
  UpdatePackageInput,
} from "./package.types";

/** Normalizes Prisma Decimal prices to plain numbers at the API boundary. */
function toPublicPackage(row: {
  id: string;
  salonId: string;
  name: string;
  slug: string;
  price: { toNumber(): number } | number;
  duration: number;
  isActive: boolean;
  services: Array<{
    serviceId: string;
    service: {
      id: string;
      name: string;
      slug: string;
      price: { toNumber(): number } | number;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
}): PublicPackage {
  return {
    ...row,
    price: Number(row.price),
    services: row.services.map((line) => ({
      ...line,
      service: { ...line.service, price: Number(line.service.price) },
    })),
  };
}

/** Lists a salon's active packages. Public endpoint. */
export async function listSalonPackageCatalog(
  salonRef: string,
  query: ListPackagesQuery,
): Promise<PaginatedPackages> {
  const salonId = await resolveSalonId(salonRef, true);
  if (!salonId) throw new SalonNotFoundError();

  const result = await listSalonPackages(salonId, {
    cursor: query.cursor,
    limit: query.limit,
    includeInactive: query.includeInactive,
  });

  return {
    items: result.items.map(toPublicPackage),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/** Loads one active package by slug. Public endpoint. */
export async function getPublicPackage(
  salonRef: string,
  slug: string,
): Promise<PublicPackage> {
  const salonId = await resolveSalonId(salonRef, true);
  if (!salonId) throw new SalonNotFoundError();

  const found = await findPackageBySlug(salonId, slug);
  if (!found) throw new PackageNotFoundError();
  return toPublicPackage(found);
}

/** Loads a salon for a management operation and asserts MANAGER+. */
async function loadManagedSalon(callerId: string, salonRef: string) {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const salon = await findSalonForViewer({ salonId, userId: callerId });
  if (!salon) throw new SalonNotFoundError();

  assertRoleAtLeast(salon.viewerRole, "MANAGER");
  return salonId;
}

/** Verifies that every serviceId belongs to the salon. */
async function assertServicesBelongToSalon(
  salonId: string,
  serviceIds: string[],
): Promise<void> {
  if (serviceIds.length === 0) return;

  const count = await import("@/lib/prisma").then(({ prisma }) =>
    prisma.service.count({
      where: { id: { in: serviceIds }, salonId },
    }),
  );

  if (count !== new Set(serviceIds).size) {
    throw new PackageServiceMismatchError();
  }
}

/**
 * Creates a package for a salon the caller manages.
 *
 * Why:
 * Slug uniqueness is salon-scoped (the DB constraint is `[salonId, slug]`),
 * so the probe and the create both pin the same salon. The race window is
 * closed by the unique constraint itself — Prisma throws P2002, which the
 * route maps to 409.
 */
export async function createSalonPackage(
  callerId: string,
  salonRef: string,
  input: CreatePackageInput,
): Promise<PublicPackage> {
  const salonId = await loadManagedSalon(callerId, salonRef);

  if (await packageSlugExists(salonId, input.slug)) {
    throw new PackageSlugConflictError();
  }

  const serviceIds = input.serviceIds ?? [];
  await assertServicesBelongToSalon(salonId, serviceIds);

  return toPublicPackage(
    await createPackage({
      salonId,
      name: input.name,
      slug: input.slug,
      price: input.price,
      duration: input.duration,
      isActive: input.isActive,
      serviceIds,
    }),
  );
}

/** Updates a package by id. MANAGER+. */
export async function updateSalonPackage(
  callerId: string,
  salonRef: string,
  packageRef: string,
  input: UpdatePackageInput,
): Promise<PublicPackage> {
  const salonId = await loadManagedSalon(callerId, salonRef);

  const existing = await findPackageById(packageRef);
  if (!existing || existing.salonId !== salonId) {
    throw new PackageNotFoundError();
  }

  if (input.serviceIds) {
    await assertServicesBelongToSalon(salonId, input.serviceIds);
  }

  return toPublicPackage(
    await updatePackageById(existing.id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.duration !== undefined ? { duration: input.duration } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.serviceIds !== undefined
        ? { serviceIds: input.serviceIds }
        : {}),
    }),
  );
}

/** Soft-deletes a package. MANAGER+. */
export async function deleteSalonPackage(
  callerId: string,
  salonRef: string,
  packageRef: string,
): Promise<void> {
  const salonId = await loadManagedSalon(callerId, salonRef);

  const existing = await findPackageById(packageRef);
  if (!existing || existing.salonId !== salonId) {
    throw new PackageNotFoundError();
  }

  await softDeletePackage(existing.id);
}
