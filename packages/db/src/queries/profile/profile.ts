import "server-only";

import type {
  CreateProfileInput,
  ProfileFilterInput,
  ListProfilesResponse,
  UpdateProfileInput,
  UserProfile,
} from "@nikharta-roop/shared";
import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../client";

const profileSelection = {
  id: true,
  status: true,
  slug: true,
  displayName: true,
  bio: true,
  avatar: true,
} as const;

/** Unique slug and userId indexes enforce conflicts even for simultaneous requests. */
export function createProfileRecord(
  userId: string,
  profileInput: CreateProfileInput,
): Promise<UserProfile> {
  return prisma.userProfile.create({
    data: {
      userId,
      displayName: profileInput.displayName,
      slug: profileInput.slug,
      bio: profileInput.bio,
      avatar: profileInput.avatar,
    },
    select: profileSelection,
  });
}

/** Count and page share one snapshot; non-admin results never include inactive accounts. */
export async function listProfileRecords(
  input: ProfileFilterInput,
  isAdmin: boolean,
): Promise<ListProfilesResponse> {
  // Escape PostgreSQL LIKE wildcards so search text is matched literally.
  const search = input.search?.replace(/[\\%_]/g, "\\$&");
  const where: Prisma.UserProfileWhereInput = {
    slug: input.slug,
    status: isAdmin ? input.status : "ACTIVE",
    user: isAdmin ? undefined : { status: "ACTIVE", emailVerified: true, deletedAt: null },
    OR: search ? [
      { slug: { contains: search, mode: "insensitive" } },
      { displayName: { contains: search, mode: "insensitive" } },
    ] : undefined,
  };
  const orderBy: Prisma.UserProfileOrderByWithRelationInput[] = [
    { [input.sortBy]: input.sortDir },
    { id: input.sortDir },
  ];
  const [totalElements, items] = await prisma.$transaction([
    prisma.userProfile.count({ where }),
    prisma.userProfile.findMany({
      where,
      orderBy,
      skip: input.page * input.size,
      take: input.size,
      select: profileSelection,
    }),
  ], { isolationLevel: "RepeatableRead" });
  return {
    items,
    page: input.page,
    size: input.size,
    totalElements,
    totalPages: Math.ceil(totalElements / input.size),
  };
}

/** Partial updates preserve omitted fields and rely on the unique slug index for conflicts. */
export function updateProfileRecord(
  userId: string,
  slug: string,
  profileInput: UpdateProfileInput,
): Promise<UserProfile> {
  return prisma.userProfile.update({
    // Match ownership and the requested slug atomically, including during slug changes.
    where: { slug, userId },
    data: profileInput,
    select: profileSelection,
  });
}

/** Remove only the public profile; account and salon records are independent. */
export async function deleteProfileRecord(slug: string): Promise<void> {
  await prisma.userProfile.delete({ where: { slug }, select: { id: true } });
}
