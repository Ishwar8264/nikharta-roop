import "server-only";

import type {
  Prisma,
  SalonCategory,
  SalonMemberRole,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import type { PublicSalonMember } from "./salon.types";

/** Columns safe to return on every public salon response. */
const PUBLIC_SALON_SELECT = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  description: true,
  descriptionHtml: true,
  descriptionJson: true,
  category: true,
  address: true,
  city: true,
  state: true,
  zip: true,
  country: true,
  timezone: true,
  lat: true,
  lng: true,
  placeId: true,
  phone: true,
  email: true,
  images: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.SalonSelect;

/**
 * Cursor-paginated list of active salons with optional filters.
 *
 * Why:
 * Cursor pagination keys off `id` (our public identifier) rather than an
 * offset, so results stay stable even when new salons are inserted between
 * page fetches. We fetch `limit + 1` rows to learn whether a next page exists
 * without running a separate count query.
 */
export async function listActiveSalons(input: {
  cursor?: string;
  limit: number;
  city?: string;
  category?: SalonCategory;
  search?: string;
}) {
  const where: Prisma.SalonWhereInput = {
    isActive: true,
    deletedAt: null,
    ...(input.city
      ? { city: { equals: input.city, mode: "insensitive" } }
      : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            {
              shortDescription: {
                contains: input.search,
                mode: "insensitive",
              },
            },
            { description: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await prisma.salon.findMany({
    where,
    select: PUBLIC_SALON_SELECT,
    orderBy: { id: "asc" },
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

/** Loads a single salon by slug, excluding soft-deleted rows. */
export async function findSalonBySlug(slug: string) {
  return prisma.salon.findFirst({
    where: { slug, deletedAt: null, isActive: true },
    select: PUBLIC_SALON_SELECT,
  });
}

/**
 * Loads the public detail projection without private or unbounded relations.
 *
 * Why separate from the list projection:
 * Listing cards need only salon columns, while detail renders opening hours
 * and a bounded service preview. Keeping separate projections prevents every
 * list row from paying for detail-only joins.
 */
export async function findSalonDetailBySlug(slug: string) {
  return prisma.salon.findFirst({
    where: { slug, deletedAt: null, isActive: true },
    select: {
      ...PUBLIC_SALON_SELECT,
      workingHours: {
        select: {
          day: true,
          openTime: true,
          closeTime: true,
          isClosed: true,
        },
        orderBy: { day: "asc" },
      },
      services: {
        where: { isActive: true, deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          duration: true,
          images: true,
          category: { select: { name: true, slug: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 6,
      },
      _count: {
        select: {
          services: { where: { isActive: true, deletedAt: null } },
          products: { where: { isActive: true, deletedAt: null } },
        },
      },
    },
  });
}

/** Loads a single salon by id, excluding soft-deleted rows. */
export async function findSalonById(id: string) {
  return prisma.salon.findFirst({
    where: { id, deletedAt: null },
    select: PUBLIC_SALON_SELECT,
  });
}

/**
 * Loads a salon together with the caller's membership role in one round trip.
 *
 * Why:
 * Management endpoints always need both the salon and the caller's role. A
 * single join avoids the N+1 pattern of "fetch salon, then fetch membership"
 * and keeps the authorization check atomic with the data fetch.
 */
export async function findSalonForViewer(input: {
  salonId: string;
  userId: string;
}) {
  const salon = await prisma.salon.findFirst({
    where: { id: input.salonId, deletedAt: null },
    select: {
      ...PUBLIC_SALON_SELECT,
      members: {
        where: { userId: input.userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!salon) return null;

  const { members, ...rest } = salon;
  if (members.length === 0) return null;

  return { ...rest, viewerRole: members[0].role };
}

/** Returns true when the given slug is already taken. */
export async function salonSlugExists(slug: string): Promise<boolean> {
  const found = await prisma.salon.findUnique({
    where: { slug },
    select: { id: true },
  });
  return found !== null;
}

/**
 * Creates a salon and its initial OWNER membership in one transaction.
 *
 * Why:
 * A salon with no owner would be orphaned and impossible to manage. Binding
 * both writes together means a partial failure cannot leave the system in
 * that state.
 */
export async function createSalonWithOwner(input: {
  ownerId: string;
  data: Prisma.SalonCreateInput;
}) {
  return prisma.$transaction(async (transaction) => {
    const salon = await transaction.salon.create({
      data: input.data,
      select: PUBLIC_SALON_SELECT,
    });

    await transaction.salonMember.create({
      data: {
        userId: input.ownerId,
        salonId: salon.id,
        role: "OWNER",
      },
    });

    return salon;
  });
}

/** Applies a partial update to a salon. */
export async function updateSalonById(
  id: string,
  data: Prisma.SalonUpdateInput,
) {
  return prisma.salon.update({
    where: { id },
    data,
    select: PUBLIC_SALON_SELECT,
  });
}

/** Marks a salon as soft-deleted. */
export async function softDeleteSalonById(id: string): Promise<void> {
  await prisma.salon.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
}

/** Lists members of a salon with the minimum user fields a UI needs. */
export async function listSalonMembers(
  salonId: string,
): Promise<PublicSalonMember[]> {
  return prisma.salonMember.findMany({
    where: { salonId },
    select: {
      id: true,
      userId: true,
      salonId: true,
      role: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ role: "asc" }, { id: "asc" }],
  });
}

/** Finds a single membership row by its primary key. */
export async function findSalonMemberById(memberId: string) {
  return prisma.salonMember.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      userId: true,
      salonId: true,
      role: true,
    },
  });
}

/** Finds the membership row for a specific user in a specific salon. */
export async function findSalonMemberByUser(input: {
  salonId: string;
  userId: string;
}) {
  return prisma.salonMember.findUnique({
    where: {
      userId_salonId: {
        userId: input.userId,
        salonId: input.salonId,
      },
    },
    select: { id: true, role: true, userId: true, salonId: true },
  });
}

/** Adds a membership row to a salon. */
export async function addSalonMember(input: {
  salonId: string;
  userId: string;
  role: SalonMemberRole;
}) {
  return prisma.salonMember.create({
    data: {
      salonId: input.salonId,
      userId: input.userId,
      role: input.role,
    },
    select: {
      id: true,
      userId: true,
      salonId: true,
      role: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

/** Removes a membership row. */
export async function removeSalonMember(memberId: string): Promise<void> {
  await prisma.salonMember.delete({ where: { id: memberId } });
}

/** Counts active OWNER memberships on a salon. */
export async function countSalonOwners(salonId: string): Promise<number> {
  return prisma.salonMember.count({
    where: { salonId, role: "OWNER" },
  });
}
