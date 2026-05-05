import { Prisma } from "@prisma/client";

import type {
  CreateOfferInput,
  UpdateOfferInput,
} from "@/schema/offers/schema.offer";

/**
 * Converts admin offer input into Prisma-safe create data.
 */
export function toOfferCreateData(
  input: CreateOfferInput,
  branchId: string | null,
) {
  return {
    branchId,
    code: input.code,
    descriptionHi: input.descriptionHi ?? null,
    discountType: input.discountType,
    discountValue: new Prisma.Decimal(input.discountValue),
    isActive: input.isActive ?? true,
    maxDiscount: toNullableDecimal(input.maxDiscount),
    minOrder: toNullableDecimal(input.minOrder),
    perUserLimit: input.perUserLimit ?? null,
    services: { create: input.serviceIds.map((serviceId) => ({ serviceId })) },
    titleEn: input.titleEn ?? null,
    titleHi: input.titleHi,
    usageLimit: input.usageLimit ?? null,
    validFrom: input.validFrom,
    validUntil: input.validUntil,
  } satisfies Prisma.OfferUncheckedCreateInput;
}

/**
 * Converts admin offer patch input into Prisma-safe update data.
 */
export function toOfferUpdateData(
  input: UpdateOfferInput,
  branchId?: string | null,
) {
  return {
    branchId,
    code: input.code,
    descriptionHi: input.descriptionHi,
    discountType: input.discountType,
    discountValue:
      input.discountValue === undefined
        ? undefined
        : new Prisma.Decimal(input.discountValue),
    isActive: input.isActive,
    maxDiscount: toOptionalDecimal(input.maxDiscount),
    minOrder: toOptionalDecimal(input.minOrder),
    perUserLimit: input.perUserLimit,
    titleEn: input.titleEn,
    titleHi: input.titleHi,
    usageLimit: input.usageLimit,
    validFrom: input.validFrom,
    validUntil: input.validUntil,
  } satisfies Prisma.OfferUncheckedUpdateInput;
}

/**
 * Converts create-time optional money fields into Decimal or null.
 */
function toNullableDecimal(value: number | null | undefined) {
  return value === undefined || value === null ? null : new Prisma.Decimal(value);
}

/**
 * Preserves omitted patch fields while allowing explicit null money values.
 */
function toOptionalDecimal(value: number | null | undefined) {
  if (value === undefined) return undefined;
  return value === null ? null : new Prisma.Decimal(value);
}
