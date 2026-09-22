import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { generateUniqueSlug } from "@/lib/slug";

import { assertRoleAtLeast } from "./salon.authorization";
import {
  LastOwnerRemovalError,
  SalonMemberExistsError,
  SalonNotFoundError,
  SlugConflictError,
} from "./salon.errors";
import {
  addSalonMember,
  countSalonOwners,
  createSalonWithOwner,
  findSalonBySlug,
  findSalonForViewer,
  findSalonMemberById,
  findSalonMemberByUser,
  listActiveSalons,
  listSalonMembers,
  removeSalonMember,
  salonSlugExists,
  softDeleteSalonById,
  updateSalonById,
} from "./salon.repository";
import type {
  AddSalonMemberInput,
  CreateSalonInput,
  ListSalonsQuery,
  PaginatedSalons,
  PublicSalon,
  PublicSalonMember,
  SalonWithViewerRole,
  UpdateSalonInput,
} from "./salon.types";

/**
 * Cursor-paginated public listing of active salons.
 *
 * Why:
 * Public endpoint — no authentication. Returns the same shape regardless of
 * who is asking, so an anonymous visitor sees exactly what a signed-in
 * customer would see until they try to manage a salon.
 */
export async function listSalons(
  query: ListSalonsQuery,
): Promise<PaginatedSalons> {
  const result = await listActiveSalons(query);
  return {
    items: result.items,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/**
 * Loads a single salon by slug for the public detail page.
 *
 * Why:
 * Slug is the public identifier, so this endpoint never leaks internal ids
 * beyond what the listing endpoint already exposes.
 */
export async function getSalonBySlug(slug: string): Promise<PublicSalon> {
  const salon = await findSalonBySlug(slug);
  if (!salon) throw new SalonNotFoundError();
  return salon;
}

/**
 * Creates a salon and records the caller as its initial OWNER.
 *
 * Why:
 * Slug uniqueness is the only invariant the caller cannot see. We probe for
 * collisions inside the service so the route stays thin and the retry loop
 * lives next to the code that owns the rule.
 *
 * The `retry` argument exists because two concurrent requests can still race
 * past the probe and hit the unique constraint. In that case we re-generate
 * and try again — a bounded loop is simpler than a DB-level constraint
 * handler and keeps the transaction small.
 */
export async function createSalon(
  ownerId: string,
  input: CreateSalonInput,
): Promise<PublicSalon> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = input.slug ?? (await generateSlugOrFail(input.name));

    try {
      return await createSalonWithOwner({
        ownerId,
        data: buildSalonCreateInput(input, slug),
      });
    } catch (error) {
      if (!isUniqueConstraintViolation(error, "slug")) throw error;
      if (input.slug) throw new SlugConflictError();
    }
  }

  throw new SlugConflictError();
}

/**
 * Applies a partial update after checking the caller's role.
 *
 * Why:
 * Every mutation on a salon requires at least MANAGER. A single fetch that
 * joins membership keeps the check atomic with the read and avoids a second
 * query. The viewer's role drives the assertion.
 */
export async function updateSalon(
  userId: string,
  salonId: string,
  input: UpdateSalonInput,
): Promise<PublicSalon> {
  const salon = await loadSalonForViewer(salonId, userId);
  assertRoleAtLeast(salon.viewerRole, "MANAGER");

  const data = buildSalonUpdateInput(input);

  try {
    return await updateSalonById(salonId, data);
  } catch (error) {
    if (isUniqueConstraintViolation(error, "slug")) {
      throw new SlugConflictError();
    }
    throw error;
  }
}

/**
 * Soft-deletes a salon. Only OWNERs can perform this.
 *
 * Why:
 * Deleting a salon is destructive for every downstream appointment, service,
 * and product. The row is kept with `deletedAt` set so historical data and
 * audit trails stay referentially intact.
 */
export async function deleteSalon(
  userId: string,
  salonId: string,
): Promise<void> {
  const salon = await loadSalonForViewer(salonId, userId);
  assertRoleAtLeast(salon.viewerRole, "OWNER");

  await softDeleteSalonById(salonId);
}

/** Lists members of a salon. Managers and up can see the roster. */
export async function getSalonMembers(
  userId: string,
  salonId: string,
): Promise<PublicSalonMember[]> {
  const salon = await loadSalonForViewer(salonId, userId);
  assertRoleAtLeast(salon.viewerRole, "MANAGER");

  return listSalonMembers(salonId);
}

/**
 * Adds a member to a salon. OWNER only.
 *
 * Why:
 * Promoting someone into a salon grants them access to customer data and
 * money flows. Keeping this strictly to OWNER prevents a compromised MANAGER
 * account from expanding its own privileges.
 */
export async function addSalonMemberByOwner(
  actorId: string,
  salonId: string,
  input: AddSalonMemberInput,
): Promise<PublicSalonMember> {
  const salon = await loadSalonForViewer(salonId, actorId);
  assertRoleAtLeast(salon.viewerRole, "OWNER");

  const existing = await findSalonMemberByUser({
    salonId,
    userId: input.userId,
  });
  if (existing) throw new SalonMemberExistsError();

  try {
    return await addSalonMember({
      salonId,
      userId: input.userId,
      role: input.role,
    });
  } catch (error) {
    if (isUniqueConstraintViolation(error, "userId")) {
      throw new SalonMemberExistsError();
    }
    throw error;
  }
}

/**
 * Removes a member from a salon. OWNER only.
 *
 * Why:
 * Two invariants must hold: the caller must be an OWNER, and the salon must
 * never be left without at least one OWNER. The latter is checked against
 * the member being removed — not the caller — because a salon can legally
 * have multiple OWNERs.
 */
export async function removeSalonMemberByOwner(
  actorId: string,
  salonId: string,
  memberId: string,
): Promise<void> {
  const salon = await loadSalonForViewer(salonId, actorId);
  assertRoleAtLeast(salon.viewerRole, "OWNER");

  const member = await findSalonMemberById(memberId);
  if (!member || member.salonId !== salonId) {
    throw new SalonNotFoundError();
  }

  if (member.role === "OWNER") {
    const owners = await countSalonOwners(salonId);
    if (owners <= 1) throw new LastOwnerRemovalError();
  }

  await removeSalonMember(memberId);
}

/**
 * Loads a salon with the caller's role, or throws a typed error.
 *
 * Why:
 * Distinguishing "salon does not exist" from "you are not a member" leaks
 * information an attacker could use to probe salon ids. We return the same
 * error class for both so the response shape is identical.
 */
async function loadSalonForViewer(
  salonId: string,
  userId: string,
): Promise<SalonWithViewerRole> {
  const salon = await findSalonForViewer({ salonId, userId });
  if (!salon) throw new SalonNotFoundError();
  return salon;
}

/** Generates a slug and normalises slug errors into a typed conflict. */
async function generateSlugOrFail(name: string): Promise<string> {
  try {
    return await generateUniqueSlug(name, salonSlugExists);
  } catch {
    throw new SlugConflictError();
  }
}

/** Converts validated input into the Prisma create payload. */
function buildSalonCreateInput(
  input: CreateSalonInput,
  slug: string,
): Prisma.SalonCreateInput {
  return {
    name: input.name,
    slug,
    description: input.description ?? null,
    category: input.category,
    address: input.address,
    city: input.city,
    state: input.state,
    zip: input.zip,
    country: input.country,
    timezone: input.timezone,
    lat: input.lat,
    lng: input.lng,
    placeId: input.placeId ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    images: input.images,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
  };
}

/**
 * Converts validated input into the Prisma update payload.
 *
 * Why:
 * PATCH semantics require omitted fields to stay untouched. Spreading the
 * input directly would overwrite fields with `undefined` which Prisma treats
 * as "leave alone", but explicit mapping keeps the contract obvious and
 * prevents accidental field additions from leaking through.
 */
function buildSalonUpdateInput(
  input: UpdateSalonInput,
): Prisma.SalonUpdateInput {
  const data: Prisma.SalonUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.category !== undefined) data.category = input.category;
  if (input.address !== undefined) data.address = input.address;
  if (input.city !== undefined) data.city = input.city;
  if (input.state !== undefined) data.state = input.state;
  if (input.zip !== undefined) data.zip = input.zip;
  if (input.country !== undefined) data.country = input.country;
  if (input.timezone !== undefined) data.timezone = input.timezone;
  if (input.lat !== undefined) data.lat = input.lat;
  if (input.lng !== undefined) data.lng = input.lng;
  if (input.placeId !== undefined) data.placeId = input.placeId;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.email !== undefined) data.email = input.email;
  if (input.images !== undefined) data.images = input.images;
  if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle;
  if (input.seoDescription !== undefined) {
    data.seoDescription = input.seoDescription;
  }

  return data;
}

/** Checks whether Prisma reported a conflict for a specific unique field. */
function isUniqueConstraintViolation(
  error: unknown,
  field: string,
): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2002") return false;

  const target = error.meta?.target;
  if (Array.isArray(target)) return target.includes(field);
  return typeof target === "string" && target.includes(field);
}
