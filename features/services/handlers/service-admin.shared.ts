import { Prisma } from "@prisma/client";
import type { ZodType } from "zod";

import { getDb } from "@/db";
import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  SERVICE_CODES,
  SERVICE_MESSAGES,
} from "@/features/services/constants/service.constants";
import { serviceError } from "@/features/services/responses/service.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";
import type {
  CreateServiceInput,
  UpdateServiceAddOnInput,
  UpdateServiceInput,
  UpdateServiceVariantInput,
} from "@/schema/services/schema.service";

/**
 * Parses admin JSON bodies with service-owned validation error codes.
 */
export async function parseServiceJsonBody<T>(request: Request, schema: ZodType<T>) {
  const body = await readJsonBody(request);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      data: null,
      error: serviceError({
        code: SERVICE_CODES.VALIDATION_ERROR,
        message: getServiceValidationMessage(parsed.error),
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }

  return {
    data: parsed.data,
    error: null,
  };
}


/**
 * Keeps validation responses focused on the first actionable service field.
 */
function getServiceValidationMessage(error: { issues: Array<{ message?: string }> }) {
  return error.issues[0]?.message ?? SERVICE_MESSAGES.VALIDATION_ERROR;
}

/**
 * Allows only admin roles to reach service management handlers.
 */
export async function requireServiceAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth;
  }

  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: serviceError({
        code: SERVICE_CODES.FORBIDDEN,
        message: SERVICE_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }

  return auth;
}

/**
 * Branch admins stay limited to their assigned branch; super admins are global.
 */
export function assertCanManageBranch(
  adminUser: ServiceAdminUser,
  branchId: string | null,
) {
  if (
    adminUser.role === "SUPER_ADMIN" ||
    (branchId && adminUser.branchId === branchId)
  ) {
    return;
  }

  throw new ServiceVisibleError(
    SERVICE_CODES.FORBIDDEN,
    SERVICE_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}

/**
 * Resolves category branch scope while blocking global writes by branch admins.
 */
export function resolveAdminBranchId(
  requestedBranchId: string | null,
  adminUser: ServiceAdminUser,
) {
  if (adminUser.role === "SUPER_ADMIN") {
    return requestedBranchId;
  }

  if (!adminUser.branchId) {
    throw new ServiceVisibleError(
      SERVICE_CODES.FORBIDDEN,
      SERVICE_MESSAGES.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN,
    );
  }

  if (requestedBranchId && requestedBranchId !== adminUser.branchId) {
    throw new ServiceVisibleError(
      SERVICE_CODES.FORBIDDEN,
      SERVICE_MESSAGES.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN,
    );
  }

  return adminUser.branchId;
}

/**
 * Checks branch existence without exposing inactive branches to public APIs.
 */
export async function activeBranchExists(branchId: string) {
  const branch = await getDb().branch.findFirst({
    select: { id: true },
    where: { id: branchId, isActive: true },
  });

  return Boolean(branch);
}

/**
 * Checks category slug uniqueness for global or branch-specific scopes.
 */
export async function canUseCategorySlug(
  branchId: string | null,
  slug: string,
  ignoredCategoryId?: string,
) {
  const category = await getDb().serviceCategory.findFirst({
    select: {
      id: true,
    },
    where: {
      id: ignoredCategoryId
        ? {
            not: ignoredCategoryId,
          }
        : undefined,
      slug,
      slugScope: getCategorySlugScope(branchId),
    },
  });

  return !category;
}

/**
 * Checks service slug uniqueness inside one branch.
 */
export async function canUseServiceSlug(
  branchId: string,
  slug: string,
  ignoredServiceId?: string,
) {
  const service = await getDb().service.findFirst({
    select: {
      id: true,
    },
    where: {
      branchId,
      id: ignoredServiceId
        ? {
            not: ignoredServiceId,
          }
        : undefined,
      slug,
    },
  });

  return !service;
}

/**
 * Loads a service and checks that the admin can manage its branch.
 */
export async function assertManageableService(
  serviceId: string,
  adminUser: ServiceAdminUser,
) {
  const service = await getDb().service.findUnique({
    select: {
      branchId: true,
      id: true,
    },
    where: {
      id: serviceId,
    },
  });

  if (!service) {
    throw new ServiceVisibleError(
      SERVICE_CODES.SERVICE_NOT_FOUND,
      SERVICE_MESSAGES.SERVICE_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }

  assertCanManageBranch(adminUser, service.branchId);

  return service;
}

/**
 * Converts category branch scope into the DB uniqueness helper value.
 */
export function getCategorySlugScope(branchId: string | null) {
  return branchId ?? "global";
}

/**
 * Converts service create input into Prisma-safe data.
 */
export function toServiceCreateData(input: CreateServiceInput) {
  return {
    advanceAmount:
      input.advanceAmount === undefined || input.advanceAmount === null
        ? null
        : new Prisma.Decimal(input.advanceAmount),
    branchId: input.branchId,
    categoryId: input.categoryId,
    descriptionEn: input.descriptionEn ?? null,
    descriptionHi: input.descriptionHi,
    durationMinutes: input.durationMinutes,
    galleryUrls: input.galleryUrls ?? [],
    imageUrl: input.imageUrl ?? null,
    isActive: input.isActive ?? true,
    nameEn: input.nameEn,
    nameHi: input.nameHi,
    price: new Prisma.Decimal(input.price),
    slug: input.slug,
  } satisfies Prisma.ServiceCreateInput | Prisma.ServiceUncheckedCreateInput;
}

/**
 * Converts service update input into Prisma-safe data.
 */
export function toServiceUpdateData(input: UpdateServiceInput) {
  return {
    advanceAmount:
      input.advanceAmount === undefined
        ? undefined
        : input.advanceAmount === null
          ? null
          : new Prisma.Decimal(input.advanceAmount),
    branchId: input.branchId,
    categoryId: input.categoryId,
    descriptionEn: input.descriptionEn,
    descriptionHi: input.descriptionHi,
    durationMinutes: input.durationMinutes,
    galleryUrls: input.galleryUrls,
    imageUrl: input.imageUrl,
    isActive: input.isActive,
    nameEn: input.nameEn,
    nameHi: input.nameHi,
    price:
      input.price === undefined ? undefined : new Prisma.Decimal(input.price),
    slug: input.slug,
  } satisfies Prisma.ServiceUncheckedUpdateInput;
}

/**
 * Converts service variant patch input into Prisma-safe data.
 */
export function toServiceVariantUpdateData(input: UpdateServiceVariantInput) {
  return {
    advanceAmount:
      input.advanceAmount === undefined
        ? undefined
        : input.advanceAmount === null
          ? null
          : new Prisma.Decimal(input.advanceAmount),
    descriptionHi: input.descriptionHi,
    durationMinutes: input.durationMinutes,
    isActive: input.isActive,
    nameEn: input.nameEn,
    nameHi: input.nameHi,
    price:
      input.price === undefined ? undefined : new Prisma.Decimal(input.price),
    sortOrder: input.sortOrder,
  } satisfies Prisma.ServiceVariantUpdateInput;
}

/**
 * Converts service add-on patch input into Prisma-safe data.
 */
export function toServiceAddOnUpdateData(input: UpdateServiceAddOnInput) {
  return {
    descriptionHi: input.descriptionHi,
    durationMinutes: input.durationMinutes,
    isActive: input.isActive,
    nameEn: input.nameEn,
    nameHi: input.nameHi,
    price:
      input.price === undefined ? undefined : new Prisma.Decimal(input.price),
  } satisfies Prisma.ServiceAddOnUpdateInput;
}

/**
 * Converts expected service write failures into user-safe API responses.
 */
export function handleServiceWriteError(
  error: unknown,
  input: {
    failureCode: string;
    failureMessage: string;
    handler: string;
  },
) {
  if (error instanceof ServiceVisibleError) {
    return serviceError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }

  console.error(input.failureCode, {
    error,
    handler: input.handler,
  });

  return serviceError({
    code: input.failureCode,
    message: input.failureMessage,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

export type ServiceAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Carries expected service errors across helper boundaries.
 */
export class ServiceVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}

