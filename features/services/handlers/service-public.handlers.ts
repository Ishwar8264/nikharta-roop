import type { ZodError, ZodType } from "zod";

import { getDb } from "@/db";
import {
  SERVICE_CODES,
  SERVICE_MESSAGES,
} from "@/features/services/constants/service.constants";
import {
  toPublicService,
  toPublicServiceCategory,
  toPublicServiceDetail,
} from "@/features/services/helpers/service.mapper";
import {
  serviceCategorySelect,
  serviceDetailSelect,
  serviceSelect,
} from "@/features/services/helpers/service.selectors";
import {
  serviceError,
  serviceJson,
} from "@/features/services/responses/service.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  getServiceQuerySchema,
  type GetServiceQueryInput,
  listServiceCategoriesQuerySchema,
  type ListServiceCategoriesQueryInput,
  listServicesQuerySchema,
  type ListServicesQueryInput,
} from "@/schema/services/schema.service";

/**
 * Handles public service category listing for discovery filters.
 */
export async function handleListServiceCategories(request: Request) {
  const parsedQuery = parseServiceQuery(
    request,
    listServiceCategoriesQuerySchema,
  );

  if (parsedQuery.error) {
    return parsedQuery.error;
  }

  return listServiceCategories(parsedQuery.data);
}

/**
 * Handles public service listing for a selected branch.
 */
export async function handleListServices(request: Request) {
  const parsedQuery = parseServiceQuery(request, listServicesQuerySchema);

  if (parsedQuery.error) {
    return parsedQuery.error;
  }

  return listServices(parsedQuery.data);
}

/**
 * Handles public service detail loading for booking screens.
 */
export async function handleGetService(request: Request, serviceId: string) {
  const parsedQuery = parseServiceQuery(request, getServiceQuerySchema);

  if (parsedQuery.error) {
    return parsedQuery.error;
  }

  return getService(serviceId, parsedQuery.data);
}

/**
 * Lists global categories plus branch-specific categories when branchId exists.
 */
async function listServiceCategories(input: ListServiceCategoriesQueryInput) {
  try {
    if (input.branchId && !(await activeBranchExists(input.branchId))) {
      return serviceError({
        code: SERVICE_CODES.BRANCH_NOT_FOUND,
        message: SERVICE_MESSAGES.BRANCH_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    const categories = await getDb().serviceCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { nameHi: "asc" }],
      select: serviceCategorySelect(),
      where: {
        isActive: true,
        OR: input.branchId
          ? [{ branchId: null }, { branchId: input.branchId }]
          : [{ branchId: null }],
      },
    });

    return serviceJson({
      code: SERVICE_CODES.CATEGORIES_LISTED,
      data: { categories: categories.map(toPublicServiceCategory) },
      message: SERVICE_MESSAGES.CATEGORIES_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(SERVICE_CODES.CATEGORIES_LOAD_FAILED, {
      branchId: input.branchId,
      error,
      handler: "listServiceCategories",
    });

    return serviceError({
      code: SERVICE_CODES.CATEGORIES_LOAD_FAILED,
      message: SERVICE_MESSAGES.CATEGORIES_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Lists active services for one active branch with optional category filters.
 */
async function listServices(input: ListServicesQueryInput) {
  try {
    if (!(await activeBranchExists(input.branchId))) {
      return serviceError({
        code: SERVICE_CODES.BRANCH_NOT_FOUND,
        message: SERVICE_MESSAGES.BRANCH_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    const services = await getDb().service.findMany({
      orderBy: [
        { category: { sortOrder: "asc" } },
        { price: "asc" },
        { nameHi: "asc" },
      ],
      select: serviceSelect(),
      take: input.limit,
      where: {
        branchId: input.branchId,
        category: {
          id: input.categoryId,
          isActive: true,
          slug: input.categorySlug,
        },
        isActive: true,
      },
    });

    return serviceJson({
      code: SERVICE_CODES.SERVICES_LISTED,
      data: { limit: input.limit, services: services.map(toPublicService) },
      message: SERVICE_MESSAGES.SERVICES_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(SERVICE_CODES.SERVICES_LOAD_FAILED, {
      branchId: input.branchId,
      error,
      handler: "listServices",
    });

    return serviceError({
      code: SERVICE_CODES.SERVICES_LOAD_FAILED,
      message: SERVICE_MESSAGES.SERVICES_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Loads one active service with active variants and add-ons.
 */
async function getService(serviceId: string, input: GetServiceQueryInput) {
  try {
    const service = await getDb().service.findFirst({
      select: serviceDetailSelect(),
      where: {
        branch: { isActive: true },
        branchId: input.branchId,
        category: { isActive: true },
        id: serviceId,
        isActive: true,
      },
    });

    if (!service) {
      return serviceError({
        code: SERVICE_CODES.SERVICE_NOT_FOUND,
        message: SERVICE_MESSAGES.SERVICE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    return serviceJson({
      code: SERVICE_CODES.SERVICE_LOADED,
      data: { service: toPublicServiceDetail(service) },
      message: SERVICE_MESSAGES.SERVICE_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(SERVICE_CODES.SERVICE_LOAD_FAILED, {
      error,
      handler: "getService",
      serviceId,
    });

    return serviceError({
      code: SERVICE_CODES.SERVICE_LOAD_FAILED,
      message: SERVICE_MESSAGES.SERVICE_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Parses query parameters with service-owned validation error codes.
 */
function parseServiceQuery<T>(request: Request, schema: ZodType<T>) {
  const url = new URL(request.url);
  const parsed = schema.safeParse(Object.fromEntries(url.searchParams));

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

  return { data: parsed.data, error: null };
}

/**
 * Keeps validation responses focused on the first actionable service field.
 */
function getServiceValidationMessage(error: ZodError) {
  return error.issues[0]?.message ?? SERVICE_MESSAGES.VALIDATION_ERROR;
}

/**
 * Checks branch existence without exposing inactive branches to public APIs.
 */
async function activeBranchExists(branchId: string) {
  const branch = await getDb().branch.findFirst({
    select: { id: true },
    where: { id: branchId, isActive: true },
  });

  return Boolean(branch);
}
