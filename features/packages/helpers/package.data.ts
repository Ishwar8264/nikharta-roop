import { Prisma } from "@prisma/client";

import type {
  CreatePackageInput,
  UpdatePackageInput,
} from "@/schema/packages/schema.package";

/**
 * Converts package create input into Prisma-safe data.
 */
export function toPackageCreateData(input: CreatePackageInput) {
  return {
    advanceAmount: toNullableDecimal(input.advanceAmount),
    branchId: input.branchId,
    categoryId: input.categoryId ?? null,
    descriptionEn: input.descriptionEn ?? null,
    descriptionHi: input.descriptionHi ?? null,
    durationMinutes: input.durationMinutes ?? null,
    imageUrl: input.imageUrl ?? null,
    isActive: input.isActive ?? true,
    isCustom: input.isCustom ?? false,
    nameEn: input.nameEn ?? null,
    nameHi: input.nameHi,
    price: new Prisma.Decimal(input.price),
    services: { create: input.services.map(toPackageServiceCreateData) },
    slug: input.slug,
  } satisfies Prisma.PackageUncheckedCreateInput;
}

/**
 * Converts package patch input into Prisma-safe data.
 */
export function toPackageUpdateData(input: UpdatePackageInput) {
  return {
    advanceAmount: toOptionalDecimal(input.advanceAmount),
    branchId: input.branchId,
    categoryId: input.categoryId,
    descriptionEn: input.descriptionEn,
    descriptionHi: input.descriptionHi,
    durationMinutes: input.durationMinutes,
    imageUrl: input.imageUrl,
    isActive: input.isActive,
    isCustom: input.isCustom,
    nameEn: input.nameEn,
    nameHi: input.nameHi,
    price:
      input.price === undefined ? undefined : new Prisma.Decimal(input.price),
    slug: input.slug,
  } satisfies Prisma.PackageUncheckedUpdateInput;
}

function toPackageServiceCreateData(input: CreatePackageInput["services"][number]) {
  return {
    quantity: input.quantity,
    serviceId: input.serviceId,
    sortOrder: input.sortOrder,
  };
}

function toNullableDecimal(value: number | null | undefined) {
  return value === undefined || value === null ? null : new Prisma.Decimal(value);
}

function toOptionalDecimal(value: number | null | undefined) {
  if (value === undefined) return undefined;
  return value === null ? null : new Prisma.Decimal(value);
}
