import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { generateUniqueSlug } from "@/lib/slug";
import { writeAuditLog } from "@/server/modules/audit/audit.writer";
import { assertRoleAtLeast } from "@/server/modules/salon/salon.authorization";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { findSalonForViewer } from "@/server/modules/salon/salon.repository";

import {
  ServiceCategoryNotFoundError,
  ServiceCategorySlugConflictError,
  ServiceNotFoundError,
  ServiceSlugConflictError,
} from "./service.errors";
import { toPublicService } from "./service.mapper";
import {
  categoryExists,
  categorySlugExists,
  createCategory,
  createService,
  findServiceById,
  findServiceBySlug,
  listCategories,
  listServicesBySalon,
  resolveSalonId,
  serviceSlugExistsInSalon,
  softDeleteServiceById,
  updateServiceById,
} from "./service.repository";
import type {
  CreateCategoryInput,
  CreateServiceInput,
  ListCategoriesQuery,
  ListServicesQuery,
  PaginatedCategories,
  PaginatedServices,
  PublicCategory,
  PublicService,
  UpdateServiceInput,
} from "./service.types";

/**
 * Public list of services for a salon identified by slug or id.
 *
 * Why:
 * Anonymous visitors must be able to browse a salon's catalogue before they
 * sign up. Only active, non-deleted services are returned.
 */
export async function listSalonServices(
  salonRef: string,
  query: ListServicesQuery,
): Promise<PaginatedServices> {
  const salonId = await resolveSalonId(salonRef, true);
  if (!salonId) throw new SalonNotFoundError();

  const result = await listServicesBySalon(salonId, query);

  return {
    items: result.items.map(toPublicService),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/** Public detail lookup of a single service by slug within a salon. */
export async function getSalonService(
  salonRef: string,
  slug: string,
): Promise<PublicService> {
  const salonId = await resolveSalonId(salonRef, true);
  if (!salonId) throw new SalonNotFoundError();

  const service = await findServiceBySlug(salonId, slug);
  if (!service) throw new ServiceNotFoundError();

  return toPublicService(service);
}

/**
 * Creates a service inside a salon the caller manages.
 *
 * Why:
 * Authorization is inherited from the parent salon — the caller must be at
 * least MANAGER on it. Slug uniqueness is scoped to the salon, so two salons
 * can both offer a service called "haircut". Category existence is validated
 * first so a stale category id surfaces as a 404 rather than a Prisma FK error.
 */
export async function createSalonService(
  actorId: string,
  salonRef: string,
  input: CreateServiceInput,
): Promise<PublicService> {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const salon = await findSalonForViewer({ salonId, userId: actorId });
  if (!salon) throw new SalonNotFoundError();
  assertRoleAtLeast(salon.viewerRole, "MANAGER");

  if (input.categoryId) {
    const exists = await categoryExists(input.categoryId);
    if (!exists) throw new ServiceCategoryNotFoundError();
  }

  const slug = input.slug ?? (await generateSlugOrFail(salonId, input.name));

  if (input.slug) {
    const taken = await serviceSlugExistsInSalon(salonId, input.slug);
    if (taken) throw new ServiceSlugConflictError();
  }

  try {
    const created = await createService({
      salonId,
      categoryId: input.categoryId ?? null,
      name: input.name,
      slug,
      price: input.price,
      duration: input.duration,
      isActive: input.isActive,
      shortDescription: input.shortDescription ?? null,
      description: input.description ?? null,
      descriptionHtml: input.descriptionHtml ?? null,
      descriptionJson: input.descriptionJson ?? null,
      images: input.images,
    });

    writeAuditLog({
      userId: actorId,
      action: "CREATE",
      entity: "Service",
      entityId: created.id,
      newData: {
        salonId,
        name: created.name,
        slug: created.slug,
        price: Number(created.price),
        duration: created.duration,
      },
    });

    return toPublicService(created);
  } catch (error) {
    if (isUniqueConstraintViolation(error, "slug")) {
      throw new ServiceSlugConflictError();
    }
    throw error;
  }
}

/** Applies a partial update to a service. Requires MANAGER on the salon. */
export async function updateSalonService(
  actorId: string,
  salonRef: string,
  serviceRef: string,
  input: UpdateServiceInput,
): Promise<PublicService> {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const salon = await findSalonForViewer({ salonId, userId: actorId });
  if (!salon) throw new SalonNotFoundError();
  assertRoleAtLeast(salon.viewerRole, "MANAGER");

  const existing = await findServiceById(serviceRef);
  if (!existing || existing.salonId !== salonId) {
    throw new ServiceNotFoundError();
  }

  if (input.categoryId) {
    const exists = await categoryExists(input.categoryId);
    if (!exists) throw new ServiceCategoryNotFoundError();
  }

  // Slug change requires a fresh collision check within the same salon.
  if (input.slug !== undefined && input.slug !== existing.slug) {
    const taken = await serviceSlugExistsInSalon(salonId, input.slug);
    if (taken) throw new ServiceSlugConflictError();
  }

  const data: Prisma.ServiceUncheckedUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.price !== undefined) data.price = input.price;
  if (input.duration !== undefined) data.duration = input.duration;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.shortDescription !== undefined) {
    data.shortDescription = input.shortDescription;
  }
  if (input.description !== undefined) data.description = input.description;
  if (input.descriptionHtml !== undefined) {
    data.descriptionHtml = input.descriptionHtml;
  }
  if (input.descriptionJson !== undefined) {
    data.descriptionJson = input.descriptionJson;
  }
  if (input.images !== undefined) data.images = input.images;

  try {
    const updated = await updateServiceById(serviceRef, data);

    writeAuditLog({
      userId: actorId,
      action: "UPDATE",
      entity: "Service",
      entityId: serviceRef,
      oldData: {
        name: existing.name,
        slug: existing.slug,
        price: Number(existing.price),
        duration: existing.duration,
      },
      newData: {
        name: updated.name,
        slug: updated.slug,
        price: Number(updated.price),
        duration: updated.duration,
      },
    });

    return toPublicService(updated);
  } catch (error) {
    if (isUniqueConstraintViolation(error, "slug")) {
      throw new ServiceSlugConflictError();
    }
    throw error;
  }
}

/** Soft-deletes a service. Requires MANAGER on the parent salon. */
export async function deleteSalonService(
  actorId: string,
  salonRef: string,
  serviceRef: string,
): Promise<void> {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const salon = await findSalonForViewer({ salonId, userId: actorId });
  if (!salon) throw new SalonNotFoundError();
  assertRoleAtLeast(salon.viewerRole, "MANAGER");

  const existing = await findServiceById(serviceRef);
  if (!existing || existing.salonId !== salonId) {
    throw new ServiceNotFoundError();
  }

  await softDeleteServiceById(serviceRef);

  writeAuditLog({
    userId: actorId,
    action: "DELETE",
    entity: "Service",
    entityId: serviceRef,
    oldData: {
      salonId,
      name: existing.name,
      slug: existing.slug,
      price: Number(existing.price),
      duration: existing.duration,
    },
  });
}

/** Public list of global service categories. */
export async function listServiceCategories(
  query: ListCategoriesQuery,
): Promise<PaginatedCategories> {
  const result = await listCategories(query);

  return {
    items: result.items,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/**
 * Creates a global service category. SUPER_ADMIN only.
 *
 * Why:
 * Categories are shared across every salon, so only platform administrators
 * can introduce new ones — otherwise a single salon could flood the shared
 * vocabulary with duplicates.
 */
export async function createServiceCategory(
  input: CreateCategoryInput,
): Promise<PublicCategory> {
  const slug = input.slug ?? (await generateCategorySlugOrFail(input.name));

  if (input.slug) {
    const taken = await categorySlugExists(input.slug);
    if (taken) throw new ServiceCategorySlugConflictError();
  }

  try {
    const created = await createCategory({
      name: input.name,
      slug,
      icon: input.icon ?? null,
    });

    writeAuditLog({
      userId: null,
      action: "CREATE",
      entity: "ServiceCategory",
      entityId: created.id,
      newData: {
        name: created.name,
        slug: created.slug,
        icon: created.icon,
      },
    });

    return created;
  } catch (error) {
    if (isUniqueConstraintViolation(error, "slug")) {
      throw new ServiceCategorySlugConflictError();
    }
    throw error;
  }
}

/** Generates a unique service slug within the target salon. */
async function generateSlugOrFail(
  salonId: string,
  name: string,
): Promise<string> {
  try {
    return await generateUniqueSlug(
      name,
      async (candidate) =>
        candidate === "create" ||
        (await serviceSlugExistsInSalon(salonId, candidate)),
      "service",
    );
  } catch {
    throw new ServiceSlugConflictError();
  }
}

/** Generates a unique global category slug. */
async function generateCategorySlugOrFail(name: string): Promise<string> {
  try {
    return await generateUniqueSlug(name, categorySlugExists, "category");
  } catch {
    throw new ServiceCategorySlugConflictError();
  }
}

/** Checks whether Prisma reported a conflict for a specific unique field. */
function isUniqueConstraintViolation(error: unknown, field: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2002") return false;

  const target = error.meta?.target;
  if (Array.isArray(target)) return target.includes(field);
  return typeof target === "string" && target.includes(field);
}
