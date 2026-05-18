/**
 * Purpose: Admin handlers for listing, creating, and updating service records.
 * Responsibilities: enforce branch scope, validate payloads, and return API-safe service shapes.
 * Important notes: branch admins stay locked to their assigned branch while super admins can filter globally.
 */
import { getDb } from "@/db";
import {
  SERVICE_CODES,
  SERVICE_MESSAGES,
} from "@/features/services/constants/service.constants";
import { toPublicServiceDetail } from "@/features/services/helpers/service.mapper";
import { serviceDetailSelect } from "@/features/services/helpers/service.selectors";
import {
  serviceError,
  serviceJson,
} from "@/features/services/responses/service.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  createServiceSchema,
  type CreateServiceInput,
  listAdminServicesQuerySchema,
  type ListAdminServicesQueryInput,
  updateServiceSchema,
  type UpdateServiceInput,
} from "@/schema/services/schema.service";
import {
  activeBranchExists,
  assertCanManageBranch,
  canUseServiceSlug,
  handleServiceWriteError,
  parseServiceJsonBody,
  requireServiceAdmin,
  toServiceCreateData,
  toServiceUpdateData,
  type ServiceAdminUser,
} from "./service-admin.shared";

/**
 * Handles admin service listing for management screens.
 */
export async function handleListAdminServices(request: Request) {
  const auth = await requireServiceAdmin(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedQuery = parseAdminServiceListQuery(request);

  if (parsedQuery.error) {
    return parsedQuery.error;
  }

  return listAdminServices(parsedQuery.data, auth.session.user);
}

/**
 * Handles admin service creation.
 */
export async function handleCreateAdminService(request: Request) {
  const auth = await requireServiceAdmin(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseServiceJsonBody(request, createServiceSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return createAdminService(parsedBody.data, auth.session.user);
}

/**
 * Handles admin service updates.
 */
export async function handleUpdateAdminService(
  request: Request,
  serviceId: string,
) {
  const auth = await requireServiceAdmin(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseServiceJsonBody(request, updateServiceSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return updateAdminService(serviceId, parsedBody.data, auth.session.user);
}

/**
 * Lists services inside the authenticated admin user's branch scope.
 */
async function listAdminServices(
  input: ListAdminServicesQueryInput,
  adminUser: ServiceAdminUser,
) {
  try {
    const scopedBranchId = resolveAdminListBranchId(input.branchId, adminUser);

    const services = await getDb().service.findMany({
      orderBy: [
        { branch: { city: "asc" } },
        { category: { sortOrder: "asc" } },
        { nameHi: "asc" },
      ],
      select: serviceDetailSelect(false),
      take: input.limit,
      where: {
        branchId: scopedBranchId,
        categoryId: input.categoryId,
        isActive: input.status === "inactive" ? false : input.status === "active" ? true : undefined,
      },
    });

    return serviceJson({
      code: SERVICE_CODES.SERVICES_LISTED,
      data: {
        limit: input.limit,
        services: services.map(toPublicServiceDetail),
      },
      message: SERVICE_MESSAGES.SERVICES_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleServiceWriteError(error, {
      failureCode: SERVICE_CODES.SERVICES_LOAD_FAILED,
      failureMessage: SERVICE_MESSAGES.SERVICES_LOAD_FAILED,
      handler: "listAdminServices",
    });
  }
}

/**
 * Creates a service under an active branch/category pair.
 */
async function createAdminService(
  input: CreateServiceInput,
  adminUser: ServiceAdminUser,
) {
  try {
    assertCanManageBranch(adminUser, input.branchId);

    const category = await getDb().serviceCategory.findFirst({
      select: {
        id: true,
      },
      where: {
        id: input.categoryId,
        isActive: true,
        OR: [{ branchId: null }, { branchId: input.branchId }],
      },
    });

    if (!category || !(await activeBranchExists(input.branchId))) {
      return serviceError({
        code: category ? SERVICE_CODES.BRANCH_NOT_FOUND : SERVICE_CODES.CATEGORY_NOT_FOUND,
        message: category
          ? SERVICE_MESSAGES.BRANCH_NOT_FOUND
          : SERVICE_MESSAGES.CATEGORY_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    if (!(await canUseServiceSlug(input.branchId, input.slug))) {
      return serviceError({
        code: SERVICE_CODES.SERVICE_DUPLICATE,
        message: SERVICE_MESSAGES.SERVICE_DUPLICATE,
        status: HTTP_STATUS.CONFLICT,
      });
    }

    const service = await getDb().service.create({
      data: toServiceCreateData(input),
      select: serviceDetailSelect(false),
    });

    return serviceJson({
      code: SERVICE_CODES.SERVICE_CREATED,
      data: {
        service: toPublicServiceDetail(service),
      },
      message: SERVICE_MESSAGES.SERVICE_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handleServiceWriteError(error, {
      failureCode: SERVICE_CODES.SERVICE_CREATE_FAILED,
      failureMessage: SERVICE_MESSAGES.SERVICE_CREATE_FAILED,
      handler: "createAdminService",
    });
  }
}

/**
 * Parses admin list query strings with service-owned validation messages.
 */
function parseAdminServiceListQuery(request: Request) {
  const parsed = listAdminServicesQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );

  if (!parsed.success) {
    return {
      data: null,
      error: serviceError({
        code: SERVICE_CODES.VALIDATION_ERROR,
        message:
          parsed.error.issues[0]?.message ?? SERVICE_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }

  return { data: parsed.data, error: null };
}

/**
 * Resolves the branch filter while matching branch management's admin scope behavior.
 */
function resolveAdminListBranchId(
  requestedBranchId: string | undefined,
  adminUser: ServiceAdminUser,
) {
  if (adminUser.role === "SUPER_ADMIN" || !adminUser.branchId) {
    return requestedBranchId;
  }

  assertCanManageBranch(adminUser, requestedBranchId ?? adminUser.branchId ?? null);

  return adminUser.branchId;
}

/**
 * Updates one service while enforcing branch ownership and slug uniqueness.
 */
async function updateAdminService(
  serviceId: string,
  input: UpdateServiceInput,
  adminUser: ServiceAdminUser,
) {
  try {
    const existingService = await getDb().service.findUnique({
      select: {
        branchId: true,
        categoryId: true,
        id: true,
        slug: true,
      },
      where: {
        id: serviceId,
      },
    });

    if (!existingService) {
      return serviceError({
        code: SERVICE_CODES.SERVICE_NOT_FOUND,
        message: SERVICE_MESSAGES.SERVICE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    assertCanManageBranch(adminUser, existingService.branchId);

    const nextBranchId = input.branchId ?? existingService.branchId;
    const nextCategoryId = input.categoryId ?? existingService.categoryId;
    const nextSlug = input.slug ?? existingService.slug;

    assertCanManageBranch(adminUser, nextBranchId);

    const category = await getDb().serviceCategory.findFirst({
      select: {
        id: true,
      },
      where: {
        id: nextCategoryId,
        isActive: true,
        OR: [{ branchId: null }, { branchId: nextBranchId }],
      },
    });

    if (!category || !(await activeBranchExists(nextBranchId))) {
      return serviceError({
        code: category ? SERVICE_CODES.BRANCH_NOT_FOUND : SERVICE_CODES.CATEGORY_NOT_FOUND,
        message: category
          ? SERVICE_MESSAGES.BRANCH_NOT_FOUND
          : SERVICE_MESSAGES.CATEGORY_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    if (!(await canUseServiceSlug(nextBranchId, nextSlug, serviceId))) {
      return serviceError({
        code: SERVICE_CODES.SERVICE_DUPLICATE,
        message: SERVICE_MESSAGES.SERVICE_DUPLICATE,
        status: HTTP_STATUS.CONFLICT,
      });
    }

    const service = await getDb().service.update({
      data: toServiceUpdateData(input),
      select: serviceDetailSelect(false),
      where: {
        id: serviceId,
      },
    });

    return serviceJson({
      code: SERVICE_CODES.SERVICE_UPDATED,
      data: {
        service: toPublicServiceDetail(service),
      },
      message: SERVICE_MESSAGES.SERVICE_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleServiceWriteError(error, {
      failureCode: SERVICE_CODES.SERVICE_UPDATE_FAILED,
      failureMessage: SERVICE_MESSAGES.SERVICE_UPDATE_FAILED,
      handler: "updateAdminService",
    });
  }
}
